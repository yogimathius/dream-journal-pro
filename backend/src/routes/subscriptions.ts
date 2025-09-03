import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';
import express from 'express';

const router = Router();

// Validation schemas
const createSubscriptionSchema = Joi.object({
  priceId: Joi.string().required(),
  paymentMethodId: Joi.string().optional(),
});

const cancelSubscriptionSchema = Joi.object({
  immediately: Joi.boolean().default(false),
});

const updateSubscriptionSchema = Joi.object({
  priceId: Joi.string().required(),
});

const createPaymentIntentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('usd'),
});

// Public routes
router.get('/prices', generalRateLimit, SubscriptionController.getPrices);

// Webhook route (no auth, raw body)
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  SubscriptionController.handleWebhook
);

// Authenticated routes
router.use(authenticateToken);
router.use(generalRateLimit);

router.get('/status', SubscriptionController.getSubscriptionStatus);
router.get('/usage', SubscriptionController.getUsageStats);
router.get('/history', SubscriptionController.getSubscriptionHistory);

router.post('/create', validateSchema(createSubscriptionSchema), SubscriptionController.createSubscription);
router.post('/cancel', validateSchema(cancelSubscriptionSchema), SubscriptionController.cancelSubscription);
router.put('/update', validateSchema(updateSubscriptionSchema), SubscriptionController.updateSubscription);

router.post('/payment-intent', validateSchema(createPaymentIntentSchema), SubscriptionController.createPaymentIntent);

export default router;