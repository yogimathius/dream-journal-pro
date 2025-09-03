import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import cron from 'node-cron';
import { prisma } from '../config/database';
import { env } from '../config/env';

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: env.EXPO_ACCESS_TOKEN,
    });

    // Schedule daily reminder notifications at 8:00 AM
    this.scheduleDailyReminders();
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
    type: 'DREAM_REMINDER' | 'ANALYSIS_COMPLETE' | 'PATTERN_DISCOVERED' | 'SUBSCRIPTION_EXPIRING' | 'WELCOME' | 'TIP_OF_DAY' = 'DREAM_REMINDER'
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          pushNotificationToken: true,
          notificationsEnabled: true,
        },
      });

      if (!user || !user.notificationsEnabled || !user.pushNotificationToken) {
        return false;
      }

      // Check that the push token is valid
      if (!Expo.isExpoPushToken(user.pushNotificationToken)) {
        console.error(`Invalid push token for user ${userId}: ${user.pushNotificationToken}`);
        return false;
      }

      const message: ExpoPushMessage = {
        to: user.pushNotificationToken,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'normal',
        channelId: 'dream-notifications',
      };

      // Send the notification
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Save notification record
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data || {},
          sentAt: new Date(),
          delivered: tickets.length > 0 && tickets[0].status === 'ok',
        },
      });

      return tickets.length > 0 && tickets[0].status === 'ok';
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  async registerPushToken(userId: string, pushToken: string): Promise<boolean> {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        return false;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          pushNotificationToken: pushToken,
          notificationsEnabled: true,
        },
      });

      // Send welcome notification
      await this.sendPushNotification(
        userId,
        'Welcome to Dream Journal Pro! 🌙',
        'Your dream analysis journey begins now. Record your first dream tonight!',
        { type: 'welcome' },
        'WELCOME'
      );

      return true;
    } catch (error) {
      console.error('Register push token error:', error);
      return false;
    }
  }

  async unregisterPushToken(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          pushNotificationToken: null,
          notificationsEnabled: false,
        },
      });

      return true;
    } catch (error) {
      console.error('Unregister push token error:', error);
      return false;
    }
  }

  async scheduleReminder(userId: string, title: string, body: string, scheduledFor: Date): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'DREAM_REMINDER',
          title,
          body,
          scheduledFor,
        },
      });
    } catch (error) {
      console.error('Schedule reminder error:', error);
    }
  }

  private scheduleDailyReminders(): void {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      await this.processDailyReminders();
    }, {
      timezone: 'UTC',
    });

    // Also check for custom reminder times every hour
    cron.schedule('0 * * * *', async () => {
      await this.processCustomReminders();
    });
  }

  private async processDailyReminders(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          notificationsEnabled: true,
          pushNotificationToken: { not: null },
          reminderTime: null, // Users without custom reminder time get default 8 AM
        },
        select: {
          id: true,
          firstName: true,
          dreamEntriesThisMonth: true,
          subscriptionStatus: true,
        },
      });

      for (const user of users) {
        const messages = this.getReminderMessages(user);
        const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

        await this.sendPushNotification(
          user.id,
          selectedMessage.title,
          selectedMessage.body,
          { type: 'daily_reminder' },
          'DREAM_REMINDER'
        );
      }

      console.log(`Sent daily reminders to ${users.length} users`);
    } catch (error) {
      console.error('Process daily reminders error:', error);
    }
  }

  private async processCustomReminders(): Promise<void> {
    try {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      // Only process at the top of the hour
      if (currentMinute !== 0) {
        return;
      }

      const users = await prisma.user.findMany({
        where: {
          notificationsEnabled: true,
          pushNotificationToken: { not: null },
          reminderTime: { not: null },
        },
        select: {
          id: true,
          firstName: true,
          reminderTime: true,
          timezone: true,
          dreamEntriesThisMonth: true,
          subscriptionStatus: true,
        },
      });

      for (const user of users) {
        if (user.reminderTime) {
          const [reminderHour, reminderMinute] = user.reminderTime.split(':').map(Number);
          
          // Simple timezone handling - in production, you'd want proper timezone conversion
          if (reminderHour === currentHour && reminderMinute === 0) {
            const messages = this.getReminderMessages(user);
            const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

            await this.sendPushNotification(
              user.id,
              selectedMessage.title,
              selectedMessage.body,
              { type: 'custom_reminder' },
              'DREAM_REMINDER'
            );
          }
        }
      }
    } catch (error) {
      console.error('Process custom reminders error:', error);
    }
  }

  private getReminderMessages(user: any): Array<{ title: string; body: string }> {
    const name = user.firstName || 'Dreamer';
    const dreamCount = user.dreamEntriesThisMonth || 0;
    
    const messages = [
      {
        title: `Good morning, ${name}! 🌅`,
        body: 'Did you dream last night? Capture those fleeting memories before they fade away.',
      },
      {
        title: '🌙 Dream Recall Time',
        body: 'Take a moment to remember your dreams. Even fragments can reveal amazing insights!',
      },
      {
        title: `Hello ${name}! ✨`,
        body: 'Your subconscious has been working all night. What messages did it leave for you?',
      },
      {
        title: '🧠 Dream Check-In',
        body: 'Dreams are the royal road to the unconscious. What did yours reveal?',
      },
    ];

    if (dreamCount === 0) {
      messages.push({
        title: '🚀 Start Your Dream Journey',
        body: 'Record your first dream and unlock the mysteries of your subconscious mind!',
      });
    } else if (dreamCount >= 5 && user.subscriptionStatus === 'FREE') {
      messages.push({
        title: '🔓 Unlock More Insights',
        body: 'You\'ve recorded 5 dreams this month! Upgrade to Premium for unlimited entries and AI analysis.',
      });
    }

    return messages;
  }

  async sendAnalysisCompleteNotification(userId: string, dreamTitle: string): Promise<void> {
    await this.sendPushNotification(
      userId,
      'Dream Analysis Complete! ✨',
      `Your analysis for "${dreamTitle}" is ready. Discover new insights about your subconscious.`,
      { type: 'analysis_complete' },
      'ANALYSIS_COMPLETE'
    );
  }

  async sendPatternDiscoveredNotification(userId: string, patternName: string): Promise<void> {
    await this.sendPushNotification(
      userId,
      'New Pattern Discovered! 🔮',
      `We found an interesting pattern in your dreams: ${patternName}`,
      { type: 'pattern_discovered' },
      'PATTERN_DISCOVERED'
    );
  }

  async sendSubscriptionExpiringNotification(userId: string, daysLeft: number): Promise<void> {
    await this.sendPushNotification(
      userId,
      'Subscription Expiring Soon ⏰',
      `Your Premium subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Don't lose access to your advanced features!`,
      { type: 'subscription_expiring', daysLeft },
      'SUBSCRIPTION_EXPIRING'
    );
  }
}

export const notificationService = new NotificationService();