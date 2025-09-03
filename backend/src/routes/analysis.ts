import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { aiAnalysisRateLimit, generalRateLimit } from '../middleware/rateLimiting';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Apply authentication to all analysis routes
router.use(authenticateToken);

// Validation schemas
const analysisRequestSchema = Joi.object({
  analysisType: Joi.string().valid('BASIC', 'ADVANCED', 'PATTERN_RECOGNITION', 'PERSONAL_MYTHOLOGY').default('BASIC'),
});

const symbolExtractionSchema = Joi.object({
  content: Joi.string().required().min(1).max(10000),
});

// Analysis routes
router.post('/dreams/:dreamId/analyze', 
  aiAnalysisRateLimit, 
  validateSchema(analysisRequestSchema), 
  AnalysisController.analyzeDream
);

router.get('/dreams/:dreamId', AnalysisController.getDreamAnalysis);
router.get('/', generalRateLimit, AnalysisController.getUserAnalyses);
router.delete('/:id', AnalysisController.deleteAnalysis);

// Symbol extraction (utility endpoint)
router.post('/extract-symbols', 
  generalRateLimit,
  validateSchema(symbolExtractionSchema),
  AnalysisController.extractSymbols
);

export default router;