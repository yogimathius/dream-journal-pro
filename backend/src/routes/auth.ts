import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateSchema } from '../middleware/validation';
import { authRateLimit } from '../middleware/rateLimiting';
import {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
} from '../middleware/validation';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Public routes
router.post('/register', validateSchema(userRegistrationSchema), AuthController.register);
router.post('/login', validateSchema(userLoginSchema), AuthController.login);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, validateSchema(userUpdateSchema), AuthController.updateProfile);
router.post('/refresh', authenticateToken, AuthController.refreshToken);
router.delete('/account', authenticateToken, AuthController.deleteAccount);

export default router;