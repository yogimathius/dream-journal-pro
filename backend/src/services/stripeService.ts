import Stripe from 'stripe';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { notificationService } from './notificationService';

class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
          userId,
        },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      return customer;
    } catch (error) {
      console.error('Create Stripe customer error:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          stripeCustomerId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.stripeCustomerId) {
        return await this.stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
      }

      // Create new customer
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
      return await this.createCustomer(userId, user.email, name);
    } catch (error) {
      console.error('Get or create customer error:', error);
      throw new Error('Failed to get or create Stripe customer');
    }
  }

  async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId?: string
  ): Promise<Stripe.Subscription> {
    try {
      const customer = await this.getOrCreateCustomer(userId);

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
        },
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      // Save subscription to database
      await prisma.subscription.create({
        data: {
          userId,
          stripeSubscriptionId: subscription.id,
          status: this.mapSubscriptionStatus(subscription.status),
          priceId,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'PREMIUM',
          subscriptionId: subscription.id,
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        },
      });

      return subscription;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async cancelSubscription(userId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionId: true },
      });

      if (!user?.subscriptionId) {
        throw new Error('No active subscription found');
      }

      const subscription = immediately
        ? await this.stripe.subscriptions.cancel(user.subscriptionId)
        : await this.stripe.subscriptions.update(user.subscriptionId, {
            cancel_at_period_end: true,
          });

      // Update database
      await prisma.subscription.updateMany({
        where: {
          userId,
          stripeSubscriptionId: user.subscriptionId,
        },
        data: {
          cancelAtPeriodEnd: !immediately,
          canceledAt: immediately ? new Date() : undefined,
          status: immediately ? 'CANCELLED' : 'PREMIUM',
        },
      });

      if (immediately) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'CANCELLED',
            subscriptionEndsAt: new Date(),
          },
        });
      }

      return subscription;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async updateSubscription(userId: string, newPriceId: string): Promise<Stripe.Subscription> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionId: true },
      });

      if (!user?.subscriptionId) {
        throw new Error('No active subscription found');
      }

      const subscription = await this.stripe.subscriptions.retrieve(user.subscriptionId);
      
      const updatedSubscription = await this.stripe.subscriptions.update(user.subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice',
      });

      // Update database
      await prisma.subscription.updateMany({
        where: {
          userId,
          stripeSubscriptionId: user.subscriptionId,
        },
        data: {
          priceId: newPriceId,
        },
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async createPaymentIntent(userId: string, amount: number, currency: string = 'usd'): Promise<Stripe.PaymentIntent> {
    try {
      const customer = await this.getOrCreateCustomer(userId);

      return await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        customer: customer.id,
        metadata: { userId },
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      const status = this.mapSubscriptionStatus(subscription.status);

      // Update subscription in database
      await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          status,
          priceId: subscription.items.data[0]?.price?.id || '',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
        update: {
          status,
          priceId: subscription.items.data[0]?.price?.id || '',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: status,
          subscriptionId: subscription.id,
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        },
      });

      // Send notification for new subscriptions
      if (subscription.status === 'active') {
        await notificationService.sendPushNotification(
          userId,
          'Welcome to Premium! 🎉',
          'You now have access to unlimited dreams, advanced AI analysis, and pattern insights!',
          { type: 'subscription_activated' }
        );
      }
    } catch (error) {
      console.error('Handle subscription update error:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'FREE',
          subscriptionId: null,
          subscriptionEndsAt: null,
        },
      });
    } catch (error) {
      console.error('Handle subscription deleted error:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (!invoice.subscription || !invoice.customer) return;

      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = subscription.metadata.userId;

      if (!userId) return;

      // Reset monthly dream count on successful payment
      await prisma.user.update({
        where: { id: userId },
        data: {
          dreamEntriesThisMonth: 0,
          dreamEntriesResetAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Handle payment succeeded error:', error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (!invoice.subscription) return;

      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = subscription.metadata.userId;

      if (!userId) return;

      await notificationService.sendPushNotification(
        userId,
        'Payment Failed ⚠️',
        'We couldn\'t process your payment. Please update your payment method to continue enjoying Premium features.',
        { type: 'payment_failed' }
      );
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  private mapSubscriptionStatus(stripeStatus: string): 'FREE' | 'PREMIUM' | 'CANCELLED' | 'EXPIRED' {
    switch (stripeStatus) {
      case 'active':
      case 'trialing':
        return 'PREMIUM';
      case 'canceled':
      case 'unpaid':
        return 'CANCELLED';
      case 'past_due':
      case 'incomplete':
      case 'incomplete_expired':
        return 'EXPIRED';
      default:
        return 'FREE';
    }
  }

  async getPrices(): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      return prices.data;
    } catch (error) {
      console.error('Get prices error:', error);
      throw new Error('Failed to get pricing information');
    }
  }

  async getSubscriptionStatus(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionStatus: true,
          subscriptionId: true,
          subscriptionEndsAt: true,
          dreamEntriesThisMonth: true,
        },
      });

      if (!user?.subscriptionId) {
        return {
          status: user?.subscriptionStatus || 'FREE',
          dreamEntriesThisMonth: user?.dreamEntriesThisMonth || 0,
        };
      }

      const subscription = await this.stripe.subscriptions.retrieve(user.subscriptionId);
      
      return {
        status: user.subscriptionStatus,
        stripeStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        dreamEntriesThisMonth: user.dreamEntriesThisMonth,
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw new Error('Failed to get subscription status');
    }
  }
}

export const stripeService = new StripeService();