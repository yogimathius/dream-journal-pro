import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, DreamCreateData, DreamUpdateData } from '../types';

export class DreamController {
  static async createDream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dreamData = req.body as DreamCreateData;
      const userId = req.user!.id;
      const subscriptionStatus = req.user!.subscriptionStatus;

      // Check subscription limits for free users
      if (subscriptionStatus === 'FREE') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            dreamEntriesThisMonth: true,
            dreamEntriesResetAt: true,
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

        // Check if we need to reset monthly count
        const now = new Date();
        const resetDate = new Date(user.dreamEntriesResetAt);
        resetDate.setMonth(resetDate.getMonth() + 1);

        let dreamEntriesThisMonth = user.dreamEntriesThisMonth;

        if (now >= resetDate) {
          dreamEntriesThisMonth = 0;
          await prisma.user.update({
            where: { id: userId },
            data: {
              dreamEntriesThisMonth: 0,
              dreamEntriesResetAt: now,
            },
          });
        }

        // Free users are limited to 5 dreams per month
        if (dreamEntriesThisMonth >= 5 && !dreamData.isDraft) {
          const response: ApiResponse = {
            success: false,
            error: 'Monthly dream limit reached. Upgrade to Premium for unlimited dreams.',
            data: {
              upgradeRequired: true,
              currentCount: dreamEntriesThisMonth,
              limit: 5,
            },
          };
          res.status(403).json(response);
          return;
        }
      }

      // Create the dream
      const dream = await prisma.dream.create({
        data: {
          ...dreamData,
          userId,
          dreamDate: dreamData.dreamDate || new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Increment user's dream count if not a draft
      if (!dreamData.isDraft) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            dreamEntriesThisMonth: { increment: 1 },
          },
        });
      }

      const response: ApiResponse = {
        success: true,
        message: 'Dream created successfully',
        data: { dream },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create dream error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create dream',
      };
      res.status(500).json(response);
    }
  }

  static async getDreams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        page = 1,
        limit = 20,
        search,
        emotions,
        symbols,
        themes,
        dateFrom,
        dateTo,
        sortBy = 'dreamDate',
        sortOrder = 'desc',
      } = req.query as any;

      // Build where clause
      const where: any = {
        userId,
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (emotions && emotions.length > 0) {
        where.emotions = {
          hasSome: Array.isArray(emotions) ? emotions : [emotions],
        };
      }

      if (symbols && symbols.length > 0) {
        where.symbols = {
          hasSome: Array.isArray(symbols) ? symbols : [symbols],
        };
      }

      if (themes && themes.length > 0) {
        where.themes = {
          hasSome: Array.isArray(themes) ? themes : [themes],
        };
      }

      if (dateFrom || dateTo) {
        where.dreamDate = {};
        if (dateFrom) where.dreamDate.gte = new Date(dateFrom);
        if (dateTo) where.dreamDate.lte = new Date(dateTo);
      }

      // Get total count
      const total = await prisma.dream.count({ where });

      // Get dreams with pagination
      const dreams = await prisma.dream.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          dreamDate: true,
          sleepQuality: true,
          lucidity: true,
          vividness: true,
          mood: true,
          wakeUpMood: true,
          emotions: true,
          symbols: true,
          people: true,
          places: true,
          themes: true,
          colors: true,
          lifeTags: true,
          isDraft: true,
          isProcessed: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              analysis: true,
              voiceRecordings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const response: PaginatedResponse<typeof dreams[0]> = {
        success: true,
        data: dreams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get dreams error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch dreams',
      };
      res.status(500).json(response);
    }
  }

  static async getDream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dreamId = req.params.id;
      const userId = req.user!.id;

      const dream = await prisma.dream.findFirst({
        where: {
          id: dreamId,
          userId,
        },
        include: {
          voiceRecordings: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
              duration: true,
              transcription: true,
              createdAt: true,
            },
          },
          analysis: {
            select: {
              id: true,
              interpretation: true,
              symbolAnalysis: true,
              emotionalAnalysis: true,
              themes: true,
              insights: true,
              reflectionQuestions: true,
              actionableAdvice: true,
              analysisType: true,
              confidence: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!dream) {
        const response: ApiResponse = {
          success: false,
          error: 'Dream not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: { dream },
      };

      res.json(response);
    } catch (error) {
      console.error('Get dream error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch dream',
      };
      res.status(500).json(response);
    }
  }

  static async updateDream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dreamId = req.params.id;
      const userId = req.user!.id;
      const updateData = req.body as DreamUpdateData;

      // Check if dream exists and belongs to user
      const existingDream = await prisma.dream.findFirst({
        where: {
          id: dreamId,
          userId,
        },
      });

      if (!existingDream) {
        const response: ApiResponse = {
          success: false,
          error: 'Dream not found',
        };
        res.status(404).json(response);
        return;
      }

      // Update the dream
      const dream = await prisma.dream.update({
        where: { id: dreamId },
        data: {
          ...updateData,
          isProcessed: false, // Reset processed flag if content changed
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Dream updated successfully',
        data: { dream },
      };

      res.json(response);
    } catch (error) {
      console.error('Update dream error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update dream',
      };
      res.status(500).json(response);
    }
  }

  static async deleteDream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dreamId = req.params.id;
      const userId = req.user!.id;

      // Check if dream exists and belongs to user
      const existingDream = await prisma.dream.findFirst({
        where: {
          id: dreamId,
          userId,
        },
      });

      if (!existingDream) {
        const response: ApiResponse = {
          success: false,
          error: 'Dream not found',
        };
        res.status(404).json(response);
        return;
      }

      // Delete the dream (this will cascade delete related records)
      await prisma.dream.delete({
        where: { id: dreamId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Dream deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete dream error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete dream',
      };
      res.status(500).json(response);
    }
  }

  static async getDreamStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { timeRange = '30' } = req.query as any;
      
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get basic stats
      const totalDreams = await prisma.dream.count({
        where: { userId, dreamDate: { gte: startDate } },
      });

      const dreamStats = await prisma.dream.aggregate({
        where: { userId, dreamDate: { gte: startDate } },
        _avg: {
          sleepQuality: true,
          lucidity: true,
          vividness: true,
        },
      });

      // Get most common symbols, emotions, themes
      const dreams = await prisma.dream.findMany({
        where: { userId, dreamDate: { gte: startDate } },
        select: {
          symbols: true,
          emotions: true,
          themes: true,
          colors: true,
          dreamDate: true,
        },
      });

      const symbolCount: Record<string, number> = {};
      const emotionCount: Record<string, number> = {};
      const themeCount: Record<string, number> = {};
      const colorCount: Record<string, number> = {};

      dreams.forEach(dream => {
        dream.symbols.forEach(symbol => {
          symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
        });
        dream.emotions.forEach(emotion => {
          emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
        });
        dream.themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
        dream.colors.forEach(color => {
          colorCount[color] = (colorCount[color] || 0) + 1;
        });
      });

      const topSymbols = Object.entries(symbolCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([symbol, count]) => ({ symbol, count }));

      const topEmotions = Object.entries(emotionCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([emotion, count]) => ({ emotion, count }));

      const topThemes = Object.entries(themeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([theme, count]) => ({ theme, count }));

      const response: ApiResponse = {
        success: true,
        data: {
          totalDreams,
          averages: {
            sleepQuality: dreamStats._avg.sleepQuality || 0,
            lucidity: dreamStats._avg.lucidity || 0,
            vividness: dreamStats._avg.vividness || 0,
          },
          topSymbols,
          topEmotions,
          topThemes,
          timeRange: days,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get dream stats error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch dream statistics',
      };
      res.status(500).json(response);
    }
  }
}