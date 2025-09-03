import { Response } from 'express';
import { prisma } from '../config/database';
import { PatternService } from '../services/patternService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class PatternController {
  static async getUserPatterns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscriptionStatus = req.user!.subscriptionStatus;
      const { timeRange = '90', refresh = false } = req.query as any;
      
      // Pattern recognition is a premium feature
      if (subscriptionStatus === 'FREE') {
        const response: ApiResponse = {
          success: false,
          error: 'Pattern recognition requires Premium subscription',
          data: { upgradeRequired: true },
        };
        res.status(403).json(response);
        return;
      }

      const timeRangeDays = parseInt(timeRange);
      
      // Check for existing patterns if not refreshing
      if (!refresh) {
        const existingPatterns = await prisma.dreamPattern.findMany({
          where: {
            userId,
            isActive: true,
            lastOccurrence: {
              gte: new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { confidence: 'desc' },
        });

        if (existingPatterns.length > 0) {
          const response: ApiResponse = {
            success: true,
            data: {
              patterns: existingPatterns,
              cached: true,
              timeRange: timeRangeDays,
            },
          };
          res.json(response);
          return;
        }
      }

      // Detect new patterns
      const patternResult = await PatternService.detectUserPatterns(userId, timeRangeDays);
      
      if (patternResult.patterns.length === 0) {
        const response: ApiResponse = {
          success: true,
          message: 'No significant patterns detected. Try adding more dreams or increasing the time range.',
          data: {
            patterns: [],
            timeRange: timeRangeDays,
          },
        };
        res.json(response);
        return;
      }

      // Save new patterns to database
      const savedPatterns = await Promise.all(
        patternResult.patterns.map(async (pattern) => {
          // Check if similar pattern already exists
          const existingPattern = await prisma.dreamPattern.findFirst({
            where: {
              userId,
              patternType: pattern.type,
              name: pattern.name,
            },
          });

          if (existingPattern) {
            // Update existing pattern
            return prisma.dreamPattern.update({
              where: { id: existingPattern.id },
              data: {
                description: pattern.description,
                frequency: pattern.frequency,
                confidence: pattern.confidence,
                insight: pattern.insight,
                timeRange: pattern.timeRange,
                lastOccurrence: pattern.lastOccurrence,
                relatedSymbols: pattern.relatedSymbols,
                relatedEmotions: pattern.relatedEmotions,
                relatedThemes: pattern.relatedThemes,
                isActive: true,
              },
            });
          } else {
            // Create new pattern
            return prisma.dreamPattern.create({
              data: {
                userId,
                patternType: pattern.type,
                name: pattern.name,
                description: pattern.description,
                frequency: pattern.frequency,
                confidence: pattern.confidence,
                timeRange: pattern.timeRange,
                correlation: null,
                insight: pattern.insight,
                firstOccurrence: pattern.firstOccurrence,
                lastOccurrence: pattern.lastOccurrence,
                relatedSymbols: pattern.relatedSymbols,
                relatedEmotions: pattern.relatedEmotions,
                relatedThemes: pattern.relatedThemes,
              },
            });
          }
        })
      );

      const response: ApiResponse = {
        success: true,
        message: `Detected ${savedPatterns.length} patterns in your dreams`,
        data: {
          patterns: savedPatterns,
          timeRange: timeRangeDays,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get user patterns error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to analyze dream patterns',
      };
      res.status(500).json(response);
    }
  }

  static async getPatternDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patternId = req.params.id;
      const userId = req.user!.id;

      const pattern = await prisma.dreamPattern.findFirst({
        where: {
          id: patternId,
          userId,
        },
      });

      if (!pattern) {
        const response: ApiResponse = {
          success: false,
          error: 'Pattern not found',
        };
        res.status(404).json(response);
        return;
      }

      // Get related dreams based on pattern symbols/themes/emotions
      const relatedDreams = await prisma.dream.findMany({
        where: {
          userId,
          OR: [
            { symbols: { hasSome: pattern.relatedSymbols } },
            { emotions: { hasSome: pattern.relatedEmotions } },
            { themes: { hasSome: pattern.relatedThemes } },
          ],
        },
        select: {
          id: true,
          title: true,
          dreamDate: true,
          symbols: true,
          emotions: true,
          themes: true,
        },
        orderBy: { dreamDate: 'desc' },
        take: 10,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          pattern,
          relatedDreams,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get pattern detail error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch pattern details',
      };
      res.status(500).json(response);
    }
  }

  static async updatePattern(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patternId = req.params.id;
      const userId = req.user!.id;
      const { isActive, insight } = req.body;

      const pattern = await prisma.dreamPattern.findFirst({
        where: {
          id: patternId,
          userId,
        },
      });

      if (!pattern) {
        const response: ApiResponse = {
          success: false,
          error: 'Pattern not found',
        };
        res.status(404).json(response);
        return;
      }

      const updateData: any = {};
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }
      if (insight && typeof insight === 'string') {
        updateData.insight = insight;
      }

      const updatedPattern = await prisma.dreamPattern.update({
        where: { id: patternId },
        data: updateData,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Pattern updated successfully',
        data: { pattern: updatedPattern },
      };

      res.json(response);
    } catch (error) {
      console.error('Update pattern error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update pattern',
      };
      res.status(500).json(response);
    }
  }

  static async deletePattern(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patternId = req.params.id;
      const userId = req.user!.id;

      const pattern = await prisma.dreamPattern.findFirst({
        where: {
          id: patternId,
          userId,
        },
      });

      if (!pattern) {
        const response: ApiResponse = {
          success: false,
          error: 'Pattern not found',
        };
        res.status(404).json(response);
        return;
      }

      await prisma.dreamPattern.delete({
        where: { id: patternId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Pattern deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete pattern error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete pattern',
      };
      res.status(500).json(response);
    }
  }

  static async getPatternInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscriptionStatus = req.user!.subscriptionStatus;
      
      if (subscriptionStatus === 'FREE') {
        const response: ApiResponse = {
          success: false,
          error: 'Pattern insights require Premium subscription',
          data: { upgradeRequired: true },
        };
        res.status(403).json(response);
        return;
      }

      // Get active patterns
      const patterns = await prisma.dreamPattern.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: [
          { confidence: 'desc' },
          { frequency: 'desc' },
        ],
        take: 5,
      });

      // Get recent dreams for context
      const recentDreams = await prisma.dream.findMany({
        where: { userId },
        select: {
          dreamDate: true,
          emotions: true,
          symbols: true,
          themes: true,
          lucidity: true,
        },
        orderBy: { dreamDate: 'desc' },
        take: 10,
      });

      // Generate insights summary
      const insights = {
        totalPatterns: patterns.length,
        strongestPattern: patterns[0] || null,
        recentTrends: this.analyzeRecentTrends(recentDreams, patterns),
        recommendations: this.generateRecommendations(patterns),
      };

      const response: ApiResponse = {
        success: true,
        data: {
          patterns,
          insights,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get pattern insights error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to generate pattern insights',
      };
      res.status(500).json(response);
    }
  }

  private static analyzeRecentTrends(recentDreams: any[], patterns: any[]): any {
    // Simplified trend analysis
    return {
      dreamFrequency: recentDreams.length,
      averageLucidity: recentDreams.reduce((sum, dream) => sum + (dream.lucidity || 0), 0) / recentDreams.length,
      commonEmotions: this.getTopElements(recentDreams, 'emotions', 3),
      commonSymbols: this.getTopElements(recentDreams, 'symbols', 3),
    };
  }

  private static generateRecommendations(patterns: any[]): string[] {
    const recommendations = [];
    
    if (patterns.length === 0) {
      recommendations.push('Keep recording dreams regularly to help identify patterns');
    } else {
      recommendations.push('Continue tracking your dreams to strengthen pattern recognition');
      
      const symbolPatterns = patterns.filter(p => p.patternType === 'SYMBOL_FREQUENCY');
      if (symbolPatterns.length > 0) {
        recommendations.push('Pay attention to recurring symbols in your waking life for deeper insights');
      }
      
      const lucidityPatterns = patterns.filter(p => p.patternType === 'LUCIDITY_TRIGGER');
      if (lucidityPatterns.length > 0) {
        recommendations.push('Use identified lucidity triggers for dream sign recognition practice');
      }
    }
    
    return recommendations;
  }

  private static getTopElements(dreams: any[], field: string, limit: number): string[] {
    const elementCount: Record<string, number> = {};
    dreams.forEach(dream => {
      (dream[field] || []).forEach((element: string) => {
        elementCount[element] = (elementCount[element] || 0) + 1;
      });
    });
    
    return Object.entries(elementCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([element]) => element);
  }
}