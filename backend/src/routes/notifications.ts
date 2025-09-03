import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Apply authentication to all notification routes
router.use(authenticateToken);
router.use(generalRateLimit);

// Validation schemas
const pushTokenSchema = Joi.object({
  pushToken: Joi.string().required(),
});

const notificationSettingsSchema = Joi.object({
  notificationsEnabled: Joi.boolean(),
  reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
});

// Notification routes
router.post('/register-token', validateSchema(pushTokenSchema), NotificationController.registerPushToken);
router.post('/unregister-token', NotificationController.unregisterPushToken);
router.get('/settings', NotificationController.getNotificationSettings);
router.put('/settings', validateSchema(notificationSettingsSchema), NotificationController.updateNotificationSettings);
router.get('/history', NotificationController.getNotificationHistory);
router.post('/test', NotificationController.sendTestNotification);
router.post('/:id/opened', NotificationController.markNotificationOpened);

export default router;