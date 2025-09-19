import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiResponse } from '../types';

export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    message: (req: any, res: any) => {
      const response: ApiResponse = {
        success: false,
        error: 'Too many requests, please try again later',
        data: {
          retryAfter: Math.ceil(options.windowMs! / 1000 / 60),
        },
      };
      return response;
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiting
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  skipSuccessfulRequests: true,
});

// Voice upload rate limiting
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 uploads per minute
});

// AI analysis rate limiting (more restrictive for free users)
export const aiAnalysisRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 analysis requests per hour
});

// Search rate limiting
export const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 searches per minute
});