import { Router } from 'express';
import { SyncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Apply authentication to all sync routes
router.use(authenticateToken);
router.use(generalRateLimit);

// Validation schemas
const syncBatchSchema = Joi.object({
  operations: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().valid('dream', 'voiceRecording', 'user').required(),
      action: Joi.string().valid('create', 'update', 'delete').required(),
      data: Joi.object().required(),
    })
  ).max(50).required(), // Limit to 50 operations per batch
});

// Sync routes
router.get('/status', SyncController.getSyncStatus);
router.get('/last-sync-time', SyncController.getLastSyncTime);
router.get('/updates', SyncController.getUpdates);
router.post('/batch', validateSchema(syncBatchSchema), SyncController.syncBatch);

export default router;