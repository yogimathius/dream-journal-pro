import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { ApiResponse, AuthenticatedRequest, UserRegistrationData, UserLoginData } from '../types';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, firstName, lastName } = req.body as UserRegistrationData;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username || undefined },
          ],
        },
      });

      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: existingUser.email === email.toLowerCase() 
            ? 'User with this email already exists'
            : 'Username already taken',
        };
        res.status(409).json(response);
        return;
      }

      // Hash password
      const passwordHash = await AuthUtils.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          username: username || null,
          firstName: firstName || null,
          lastName: lastName || null,
          verificationToken: AuthUtils.generateVerificationToken(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      });

      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Registration failed',
      };
      res.status(500).json(response);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as UserLoginData;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
      }

      // Verify password
      const isPasswordValid = await AuthUtils.comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
      }

      // Reset monthly dream entries count if needed
      const now = new Date();
      const resetDate = new Date(user.dreamEntriesResetAt);
      resetDate.setMonth(resetDate.getMonth() + 1);

      if (now >= resetDate) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            dreamEntriesThisMonth: 0,
            dreamEntriesResetAt: now,
          },
        });
      }

      // Generate JWT token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionStatus: user.subscriptionStatus,
            dreamEntriesThisMonth: now >= resetDate ? 0 : user.dreamEntriesThisMonth,
            preferences: user.preferences,
          },
          token,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Login failed',
      };
      res.status(500).json(response);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          timezone: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          dreamEntriesThisMonth: true,
          notificationsEnabled: true,
          reminderTime: true,
          preferences: true,
          createdAt: true,
          _count: {
            select: {
              dreams: true,
              voiceRecordings: true,
            },
          },
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

      const response: ApiResponse = {
        success: true,
        data: {
          user,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get profile error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get profile',
      };
      res.status(500).json(response);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updateData = req.body;
      delete updateData.email; // Don't allow email updates through this endpoint
      delete updateData.password; // Don't allow password updates through this endpoint

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          timezone: true,
          subscriptionStatus: true,
          notificationsEnabled: true,
          reminderTime: true,
          preferences: true,
          updatedAt: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      };

      res.json(response);
    } catch (error) {
      console.error('Update profile error:', error);
      
      if ((error as any).code === 'P2002') {
        const response: ApiResponse = {
          success: false,
          error: 'Username already taken',
        };
        res.status(409).json(response);
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: 'Failed to update profile',
      };
      res.status(500).json(response);
    }
  }

  static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          subscriptionStatus: true,
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

      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      });

      const response: ApiResponse = {
        success: true,
        data: { token },
      };

      res.json(response);
    } catch (error) {
      console.error('Refresh token error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to refresh token',
      };
      res.status(500).json(response);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Soft delete by marking user as inactive and clearing sensitive data
      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          email: `deleted_${req.user!.id}@deleted.com`,
          passwordHash: 'deleted',
          firstName: null,
          lastName: null,
          username: null,
          avatar: null,
          pushNotificationToken: null,
          verificationToken: null,
          resetPasswordToken: null,
          preferences: {},
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Account deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete account error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete account',
      };
      res.status(500).json(response);
    }
  }
}