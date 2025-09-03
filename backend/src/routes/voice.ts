import { Router } from 'express';
import { VoiceController, uploadMiddleware } from '../controllers/voiceController';
import { authenticateToken } from '../middleware/auth';
import { uploadRateLimit, generalRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Apply authentication to all voice routes
router.use(authenticateToken);

// Voice recording routes
router.post('/upload', uploadRateLimit, uploadMiddleware, VoiceController.uploadVoiceRecording);
router.get('/', generalRateLimit, VoiceController.getVoiceRecordings);
router.get('/:id', VoiceController.getVoiceRecording);
router.delete('/:id', VoiceController.deleteVoiceRecording);
router.post('/:id/transcribe', VoiceController.transcribeVoiceRecording);

export default router;