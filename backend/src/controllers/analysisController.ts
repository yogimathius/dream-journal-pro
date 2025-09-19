import { Response } from 'express';
import { prisma } from '../config/database';
import { openaiService } from '../services/openaiService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class AnalysisController {
  static async analyzeDream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dreamId = req.params.dreamId;
      const subscriptionStatus = req.user!.subscriptionStatus;
      const { analysisType = 'BASIC' } = req.body;

      // Premium features check
      if (analysisType !== 'BASIC' && subscriptionStatus === 'FREE') {
        const response: ApiResponse = {
          success: false,
          error: 'Advanced analysis features require Premium subscription',
          data: { upgradeRequired: true },
        };
        res.status(403).json(response);
        return;
      }

      // Find the dream
      const dream = await prisma.dream.findFirst({
        where: {
          id: dreamId,
          userId,
        },
        include: {
          analysis: {
            where: { analysisType },
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

      // Return existing analysis if found
      if (dream.analysis.length > 0) {
        const response: ApiResponse = {
          success: true,
          data: {
            analysis: dream.analysis[0],
            cached: true,
          },
        };
        res.json(response);
        return;
      }

      // Get user's recent dreams for context (Premium feature)
      let userHistory: any[] = [];
      if (subscriptionStatus === 'PREMIUM') {
        const recentDreams = await prisma.dream.findMany({
          where: {
            userId,
            id: { not: dreamId },
          },
          select: {
            dreamDate: true,
            symbols: true,
            emotions: true,
            themes: true,
          },
          orderBy: { dreamDate: 'desc' },
          take: 5,
        });

        userHistory = recentDreams.map((d: any) => ({
          date: d.dreamDate,
          symbols: d.symbols,
          emotions: d.emotions,
          themes: d.themes,
        }));
      }

      // Perform AI analysis
      const startTime = Date.now();
      const analysisResult = await openaiService.analyzeDream({
        title: dream.title,
        content: dream.content,
        emotions: dream.emotions,
        symbols: dream.symbols,
        themes: dream.themes,
        userHistory,
        analysisType: analysisType as any,
      });
      const processingTime = Date.now() - startTime;

      // Save analysis to database
      const analysis = await prisma.dreamAnalysis.create({
        data: {
          userId,
          dreamId,
          interpretation: analysisResult.interpretation,
          symbolAnalysis: analysisResult.symbolAnalysis,
          emotionalAnalysis: analysisResult.emotionalAnalysis,
          themes: analysisResult.themes,
          insights: analysisResult.insights,
          reflectionQuestions: analysisResult.reflectionQuestions,
          actionableAdvice: analysisResult.actionableAdvice,
          analysisType,
          confidence: analysisResult.confidence,
          processingTime,
        },
      });

      // Mark dream as processed
      await prisma.dream.update({
        where: { id: dreamId },
        data: { isProcessed: true },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Dream analysis completed successfully',
        data: { analysis },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Dream analysis error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze dream',
      };
      res.status(500).json(response);
    }
  }

  static async getDreamAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dreamId = req.params.dreamId;
      const { analysisType } = req.query as any;

      const where: any = {
        dreamId,
        userId,
      };

      if (analysisType) {
        where.analysisType = analysisType;
      }

      const analyses = await prisma.dreamAnalysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          dream: {
            select: {
              id: true,
              title: true,
              dreamDate: true,
            },
          },
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { analyses },
      };

      res.json(response);
    } catch (error) {
      console.error('Get dream analysis error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch dream analysis',
      };
      res.status(500).json(response);
    }
  }

  static async getUserAnalyses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, analysisType } = req.query as any;

      const where: any = { userId };
      if (analysisType) {
        where.analysisType = analysisType;
      }

      const total = await prisma.dreamAnalysis.count({ where });

      const analyses = await prisma.dreamAnalysis.findMany({
        where,
        select: {
          id: true,
          interpretation: true,
          themes: true,
          insights: true,
          analysisType: true,
          confidence: true,
          createdAt: true,
          dream: {
            select: {
              id: true,
              title: true,
              dreamDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          analyses,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get user analyses error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch user analyses',
      };
      res.status(500).json(response);
    }
  }

  static async deleteAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analysisId = req.params.id;
      const userId = req.user!.id;

      const analysis = await prisma.dreamAnalysis.findFirst({
        where: {
          id: analysisId,
          userId,
        },
      });

      if (!analysis) {
        const response: ApiResponse = {
          success: false,
          error: 'Analysis not found',
        };
        res.status(404).json(response);
        return;
      }

      await prisma.dreamAnalysis.delete({
        where: { id: analysisId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Analysis deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete analysis error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete analysis',
      };
      res.status(500).json(response);
    }
  }

  static async extractSymbols(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        const response: ApiResponse = {
          success: false,
          error: 'Dream content is required',
        };
        res.status(400).json(response);
        return;
      }

      const symbols = await openaiService.extractSymbols(content);

      const response: ApiResponse = {
        success: true,
        data: { symbols },
      };

      res.json(response);
    } catch (error) {
      console.error('Extract symbols error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to extract symbols',
      };
      res.status(500).json(response);
    }
  }
}