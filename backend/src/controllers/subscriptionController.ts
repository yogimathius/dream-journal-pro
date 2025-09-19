import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stripeService } from '../services/stripeService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class SubscriptionController {
  static async getSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const status = await stripeService.getSubscriptionStatus(userId);

      const response: ApiResponse = {
        success: true,
        data: status,
      };

      res.json(response);
    } catch (error) {
      console.error('Get subscription status error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get subscription status',
      };
      res.status(500).json(response);
    }
  }

  static async createSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { priceId, paymentMethodId } = req.body;

      if (!priceId) {
        const response: ApiResponse = {
          success: false,
          error: 'Price ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const subscription = await stripeService.createSubscription(userId, priceId, paymentMethodId);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice
            ? (subscription.latest_invoice as any).payment_intent?.client_secret
            : null,
          status: subscription.status,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create subscription error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
      res.status(500).json(response);
    }
  }

  static async cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { immediately = false } = req.body;

      const subscription = await stripeService.cancelSubscription(userId, immediately);

      const response: ApiResponse = {
        success: true,
        message: immediately 
          ? 'Subscription cancelled immediately' 
          : 'Subscription will cancel at the end of the current period',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
      res.status(500).json(response);
    }
  }

  static async updateSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { priceId } = req.body;

      if (!priceId) {
        const response: ApiResponse = {
          success: false,
          error: 'Price ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const subscription = await stripeService.updateSubscription(userId, priceId);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Update subscription error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update subscription',
      };
      res.status(500).json(response);
    }
  }

  static async getPrices(req: Request, res: Response): Promise<void> {
    try {
      const prices = await stripeService.getPrices();
      
      // Filter and format prices for the frontend
      const formattedPrices = prices
        .filter(price => price.active && price.product)
        .map(price => ({
          id: price.id,
          nickname: price.nickname,
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          intervalCount: price.recurring?.interval_count,
          product: {
            id: (price.product as any).id,
            name: (price.product as any).name,
            description: (price.product as any).description,
          },
        }));

      const response: ApiResponse = {
        success: true,
        data: { prices: formattedPrices },
      };

      res.json(response);
    } catch (error) {
      console.error('Get prices error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get pricing information',
      };
      res.status(500).json(response);
    }
  }

  static async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, currency = 'usd' } = req.body;

      if (!amount || amount <= 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Valid amount is required',
        };
        res.status(400).json(response);
        return;
      }

      const paymentIntent = await stripeService.createPaymentIntent(userId, amount, currency);

      const response: ApiResponse = {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Create payment intent error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create payment intent',
      };
      res.status(500).json(response);
    }
  }

  static async getSubscriptionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query as any;

      const total = await prisma.subscription.count({ where: { userId } });

      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        select: {
          id: true,
          stripeSubscriptionId: true,
          status: true,
          priceId: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          canceledAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          subscriptions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get subscription history error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get subscription history',
      };
      res.status(500).json(response);
    }
  }

  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        res.status(400).send('Missing stripe-signature header');
        return;
      }

      await stripeService.handleWebhook(req.body, signature);
      
      res.status(200).send('Webhook handled successfully');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUsageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionStatus: true,
          dreamEntriesThisMonth: true,
          dreamEntriesResetAt: true,
        },
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      const limits = {
        FREE: {
          dreamsPerMonth: 5,
          aiAnalysis: false,
          patternRecognition: false,
          voiceRecordings: true,
        },
        PREMIUM: {
          dreamsPerMonth: -1, // unlimited
          aiAnalysis: true,
          patternRecognition: true,
          voiceRecordings: true,
        },
      };

      const currentLimits = limits[user.subscriptionStatus as keyof typeof limits] || limits.FREE;

      const response: ApiResponse = {
        success: true,
        data: {
          subscriptionStatus: user.subscriptionStatus,
          dreamEntriesThisMonth: user.dreamEntriesThisMonth,
          dreamEntriesResetAt: user.dreamEntriesResetAt,
          limits: currentLimits,
          usage: {
            dreamProgress: currentLimits.dreamsPerMonth === -1 
              ? null 
              : (user.dreamEntriesThisMonth / currentLimits.dreamsPerMonth) * 100,
            canCreateDream: currentLimits.dreamsPerMonth === -1 
              || user.dreamEntriesThisMonth < currentLimits.dreamsPerMonth,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get usage stats error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get usage statistics',
      };
      res.status(500).json(response);
    }
  }
}