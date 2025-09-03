import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../config/database';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: 'Access token required',
    };
    res.status(401).json(response);
    return;
  }

  const payload = AuthUtils.verifyToken(token);
  
  if (!payload) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
    };
    res.status(403).json(response);
    return;
  }

  try {
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isVerified: true,
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

    req.user = {
      id: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
    };
    res.status(500).json(response);
  }
};

export const requireSubscription = (
  requiredStatus: 'FREE' | 'PREMIUM' = 'PREMIUM'
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (requiredStatus === 'PREMIUM' && req.user.subscriptionStatus === 'FREE') {
      const response: ApiResponse = {
        success: false,
        error: 'Premium subscription required',
        data: { upgradeRequired: true },
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

export const requireVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // For now, we'll skip email verification in development
  // In production, you'd check user.isVerified
  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  const payload = AuthUtils.verifyToken(token);
  
  if (payload) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          subscriptionStatus: true,
        },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
        };
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }

  next();
};