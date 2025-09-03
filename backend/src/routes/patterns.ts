import { Router } from 'express';
import { PatternController } from '../controllers/patternController';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Apply authentication and premium subscription requirement to all pattern routes
router.use(authenticateToken);
router.use(requireSubscription('PREMIUM'));

// Validation schemas
const patternQuerySchema = Joi.object({
  timeRange: Joi.number().integer().min(7).max(365).default(90),
  refresh: Joi.boolean().default(false),
});

const patternUpdateSchema = Joi.object({
  isActive: Joi.boolean(),
  insight: Joi.string().max(1000),
});

// Pattern routes
router.get('/', generalRateLimit, PatternController.getUserPatterns);
router.get('/insights', PatternController.getPatternInsights);
router.get('/:id', PatternController.getPatternDetail);
router.put('/:id', validateSchema(patternUpdateSchema), PatternController.updatePattern);
router.delete('/:id', PatternController.deletePattern);

export default router;