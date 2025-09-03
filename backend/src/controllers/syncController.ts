import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class SyncController {
  static async getLastSyncTime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Get the most recent update time across all user data
      const lastUpdate = await prisma.$queryRaw<Array<{ max_updated: Date }>>`
        SELECT MAX(GREATEST(
          COALESCE((SELECT MAX(updated_at) FROM dreams WHERE user_id = ${userId}), '1970-01-01'),
          COALESCE((SELECT MAX(updated_at) FROM voice_recordings WHERE user_id = ${userId}), '1970-01-01'),
          COALESCE((SELECT MAX(updated_at) FROM dream_analyses WHERE user_id = ${userId}), '1970-01-01'),
          COALESCE((SELECT MAX(updated_at) FROM dream_patterns WHERE user_id = ${userId}), '1970-01-01'),
          COALESCE((SELECT MAX(updated_at) FROM users WHERE id = ${userId}), '1970-01-01')
        )) as max_updated
      `;

      const lastSyncTime = lastUpdate[0]?.max_updated || new Date('1970-01-01');

      const response: ApiResponse = {
        success: true,
        data: {
          lastSyncTime,
          serverTime: new Date(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get last sync time error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get sync information',
      };
      res.status(500).json(response);
    }
  }

  static async getUpdates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { since } = req.query as any;
      
      if (!since) {
        const response: ApiResponse = {
          success: false,
          error: 'Since parameter is required',
        };
        res.status(400).json(response);
        return;
      }

      const sinceDate = new Date(since);
      
      // Get all updates since the specified time
      const [dreams, voiceRecordings, analyses, patterns] = await Promise.all([
        prisma.dream.findMany({
          where: {
            userId,
            updatedAt: { gt: sinceDate },
          },
          include: {
            _count: {
              select: {
                analysis: true,
                voiceRecordings: true,
              },
            },
          },
        }),
        
        prisma.voiceRecording.findMany({
          where: {
            userId,
            updatedAt: { gt: sinceDate },
          },
          select: {
            id: true,
            dreamId: true,
            fileName: true,
            fileSize: true,
            duration: true,
            transcription: true,
            isProcessed: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        
        prisma.dreamAnalysis.findMany({
          where: {
            userId,
            updatedAt: { gt: sinceDate },
          },
        }),
        
        prisma.dreamPattern.findMany({
          where: {
            userId,
            updatedAt: { gt: sinceDate },
          },
        }),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          dreams,
          voiceRecordings,
          analyses,
          patterns,
          syncTime: new Date(),
          hasMore: false, // For pagination if needed in the future
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get updates error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch updates',
      };
      res.status(500).json(response);
    }
  }

  static async syncBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { operations } = req.body;
      
      if (!operations || !Array.isArray(operations)) {
        const response: ApiResponse = {
          success: false,
          error: 'Operations array is required',
        };
        res.status(400).json(response);
        return;
      }

      const results = [];
      
      for (const operation of operations) {
        try {
          const result = await this.processSyncOperation(userId, operation);
          results.push({
            id: operation.id,
            success: true,
            data: result,
          });
        } catch (error) {
          results.push({
            id: operation.id,
            success: false,
            error: error instanceof Error ? error.message : 'Operation failed',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      const response: ApiResponse = {
        success: true,
        message: `Sync completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Sync batch error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to process sync batch',
      };
      res.status(500).json(response);
    }
  }

  static async getSyncStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Get counts and status of user data
      const [dreamCount, voiceCount, analysisCount, patternCount, user] = await Promise.all([
        prisma.dream.count({ where: { userId } }),
        prisma.voiceRecording.count({ where: { userId } }),
        prisma.dreamAnalysis.count({ where: { userId } }),
        prisma.dreamPattern.count({ where: { userId } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            dreamEntriesThisMonth: true,
            subscriptionStatus: true,
            updatedAt: true,
          },
        }),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          counts: {
            dreams: dreamCount,
            voiceRecordings: voiceCount,
            analyses: analysisCount,
            patterns: patternCount,
          },
          user: {
            dreamEntriesThisMonth: user?.dreamEntriesThisMonth || 0,
            subscriptionStatus: user?.subscriptionStatus || 'FREE',
            lastUpdated: user?.updatedAt,
          },
          serverTime: new Date(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get sync status error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get sync status',
      };
      res.status(500).json(response);
    }
  }

  private static async processSyncOperation(userId: string, operation: any): Promise<any> {
    const { type, action, data } = operation;
    
    switch (type) {
      case 'dream':
        return this.processDreamOperation(userId, action, data);
      case 'voiceRecording':
        return this.processVoiceOperation(userId, action, data);
      case 'user':
        return this.processUserOperation(userId, action, data);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  private static async processDreamOperation(userId: string, action: string, data: any): Promise<any> {
    switch (action) {
      case 'create':
        return prisma.dream.create({
          data: {
            ...data,
            userId,
          },
        });
      
      case 'update':
        return prisma.dream.update({
          where: {
            id: data.id,
            userId, // Ensure user owns the dream
          },
          data,
        });
      
      case 'delete':
        return prisma.dream.delete({
          where: {
            id: data.id,
            userId, // Ensure user owns the dream
          },
        });
      
      default:
        throw new Error(`Unknown dream action: ${action}`);
    }
  }

  private static async processVoiceOperation(userId: string, action: string, data: any): Promise<any> {
    switch (action) {
      case 'update':
        return prisma.voiceRecording.update({
          where: {
            id: data.id,
            userId, // Ensure user owns the recording
          },
          data,
        });
      
      case 'delete':
        return prisma.voiceRecording.delete({
          where: {
            id: data.id,
            userId, // Ensure user owns the recording
          },
        });
      
      default:
        throw new Error(`Unknown voice recording action: ${action}`);
    }
  }

  private static async processUserOperation(userId: string, action: string, data: any): Promise<any> {
    if (action === 'update') {
      // Only allow updating certain fields
      const allowedFields = ['preferences', 'notificationsEnabled', 'reminderTime', 'timezone'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }
      
      return prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } else {
      throw new Error(`Unknown user action: ${action}`);
    }
  }
}