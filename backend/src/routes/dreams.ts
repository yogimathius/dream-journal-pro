import { Router } from 'express';
import { DreamController } from '../controllers/dreamController';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { validateSchema, validateQuery } from '../middleware/validation';
import { generalRateLimit, searchRateLimit } from '../middleware/rateLimiting';
import {
  dreamCreateSchema,
  dreamUpdateSchema,
  dreamQuerySchema,
} from '../middleware/validation';

const router = Router();

// Apply authentication to all dream routes
router.use(authenticateToken);

// Apply general rate limiting
router.use(generalRateLimit);

// Dream CRUD routes
router.post('/', validateSchema(dreamCreateSchema), DreamController.createDream);
router.get('/', searchRateLimit, validateQuery(dreamQuerySchema), DreamController.getDreams);
router.get('/stats', DreamController.getDreamStats);
router.get('/:id', DreamController.getDream);
router.put('/:id', validateSchema(dreamUpdateSchema), DreamController.updateDream);
router.delete('/:id', DreamController.deleteDream);

export default router;