import { Response } from 'express';
import { prisma } from '../config/database';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class NotificationController {
  static async registerPushToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { pushToken } = req.body;

      if (!pushToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Push token is required',
        };
        res.status(400).json(response);
        return;
      }

      const success = await notificationService.registerPushToken(userId, pushToken);

      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid push token format',
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Push token registered successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Register push token error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to register push token',
      };
      res.status(500).json(response);
    }
  }

  static async unregisterPushToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const success = await notificationService.unregisterPushToken(userId);

      const response: ApiResponse = {
        success: success,
        message: success ? 'Push token unregistered successfully' : 'Failed to unregister push token',
      };

      res.json(response);
    } catch (error) {
      console.error('Unregister push token error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to unregister push token',
      };
      res.status(500).json(response);
    }
  }

  static async updateNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { notificationsEnabled, reminderTime } = req.body;

      const updateData: any = {};
      if (typeof notificationsEnabled === 'boolean') {
        updateData.notificationsEnabled = notificationsEnabled;
      }
      if (reminderTime !== undefined) {
        updateData.reminderTime = reminderTime;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          notificationsEnabled: true,
          reminderTime: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Notification settings updated successfully',
        data: {
          notificationsEnabled: user.notificationsEnabled,
          reminderTime: user.reminderTime,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Update notification settings error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update notification settings',
      };
      res.status(500).json(response);
    }
  }

  static async getNotificationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, type } = req.query as any;

      const where: any = { userId };
      if (type) {
        where.type = type;
      }

      const total = await prisma.notification.count({ where });

      const notifications = await prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          scheduledFor: true,
          sentAt: true,
          delivered: true,
          opened: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          notifications,
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
      console.error('Get notification history error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch notification history',
      };
      res.status(500).json(response);
    }
  }

  static async markNotificationOpened(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        const response: ApiResponse = {
          success: false,
          error: 'Notification not found',
        };
        res.status(404).json(response);
        return;
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { opened: true },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as opened',
      };

      res.json(response);
    } catch (error) {
      console.error('Mark notification opened error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update notification',
      };
      res.status(500).json(response);
    }
  }

  static async sendTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const success = await notificationService.sendPushNotification(
        userId,
        'Test Notification 🧪',
        'This is a test notification to verify your push notifications are working correctly!',
        { type: 'test' }
      );

      const response: ApiResponse = {
        success,
        message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
      };

      res.json(response);
    } catch (error) {
      console.error('Send test notification error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to send test notification',
      };
      res.status(500).json(response);
    }
  }

  static async getNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notificationsEnabled: true,
          reminderTime: true,
          pushNotificationToken: true,
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

      const response: ApiResponse = {
        success: true,
        data: {
          notificationsEnabled: user.notificationsEnabled,
          reminderTime: user.reminderTime,
          hasToken: !!user.pushNotificationToken,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get notification settings error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get notification settings',
      };
      res.status(500).json(response);
    }
  }
}