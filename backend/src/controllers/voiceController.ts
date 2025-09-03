import { Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { s3Service } from '../services/s3Service';
import { AuthenticatedRequest, ApiResponse } from '../types';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (!file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export const uploadMiddleware = upload.single('audio');

export class VoiceController {
  static async uploadVoiceRecording(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dreamId = req.body.dreamId;
      
      if (!req.file) {
        const response: ApiResponse = {
          success: false,
          error: 'No audio file provided',
        };
        res.status(400).json(response);
        return;
      }

      // Validate dream exists if dreamId provided
      if (dreamId) {
        const dream = await prisma.dream.findFirst({
          where: {
            id: dreamId,
            userId,
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
      }

      // Generate unique file key
      const fileKey = s3Service.generateFileKey(userId, dreamId);
      
      // Upload to S3
      const uploadResult = await s3Service.uploadVoiceRecording(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save recording metadata to database
      const voiceRecording = await prisma.voiceRecording.create({
        data: {
          userId,
          dreamId: dreamId || null,
          fileName: req.file.originalname,
          filePath: uploadResult.Key!,
          fileSize: req.file.size,
          duration: 0, // Will be updated when processed
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Voice recording uploaded successfully',
        data: {
          voiceRecording: {
            id: voiceRecording.id,
            fileName: voiceRecording.fileName,
            filePath: voiceRecording.filePath,
            fileSize: voiceRecording.fileSize,
            createdAt: voiceRecording.createdAt,
          },
          uploadUrl: uploadResult.Location,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Upload voice recording error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload voice recording',
      };
      res.status(500).json(response);
    }
  }

  static async getVoiceRecordings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { dreamId, page = 1, limit = 20 } = req.query as any;

      const where: any = { userId };
      if (dreamId) {
        where.dreamId = dreamId;
      }

      const total = await prisma.voiceRecording.count({ where });

      const voiceRecordings = await prisma.voiceRecording.findMany({
        where,
        select: {
          id: true,
          fileName: true,
          filePath: true,
          fileSize: true,
          duration: true,
          transcription: true,
          isProcessed: true,
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

      // Generate signed URLs for accessing recordings
      const recordingsWithUrls = await Promise.all(
        voiceRecordings.map(async (recording) => {
          let signedUrl = null;
          try {
            signedUrl = await s3Service.getSignedUrl(recording.filePath, 3600); // 1 hour
          } catch (error) {
            console.error(`Failed to generate signed URL for ${recording.id}:`, error);
          }
          
          return {
            ...recording,
            signedUrl,
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        data: {
          voiceRecordings: recordingsWithUrls,
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
      console.error('Get voice recordings error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch voice recordings',
      };
      res.status(500).json(response);
    }
  }

  static async getVoiceRecording(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const recordingId = req.params.id;
      const userId = req.user!.id;

      const voiceRecording = await prisma.voiceRecording.findFirst({
        where: {
          id: recordingId,
          userId,
        },
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

      if (!voiceRecording) {
        const response: ApiResponse = {
          success: false,
          error: 'Voice recording not found',
        };
        res.status(404).json(response);
        return;
      }

      // Generate signed URL for accessing the recording
      let signedUrl = null;
      try {
        signedUrl = await s3Service.getSignedUrl(voiceRecording.filePath, 3600);
      } catch (error) {
        console.error('Failed to generate signed URL:', error);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          voiceRecording: {
            ...voiceRecording,
            signedUrl,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get voice recording error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch voice recording',
      };
      res.status(500).json(response);
    }
  }

  static async deleteVoiceRecording(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const recordingId = req.params.id;
      const userId = req.user!.id;

      const voiceRecording = await prisma.voiceRecording.findFirst({
        where: {
          id: recordingId,
          userId,
        },
      });

      if (!voiceRecording) {
        const response: ApiResponse = {
          success: false,
          error: 'Voice recording not found',
        };
        res.status(404).json(response);
        return;
      }

      // Delete from S3
      try {
        await s3Service.deleteVoiceRecording(voiceRecording.filePath);
      } catch (error) {
        console.error('Failed to delete from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database
      await prisma.voiceRecording.delete({
        where: { id: recordingId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Voice recording deleted successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete voice recording error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete voice recording',
      };
      res.status(500).json(response);
    }
  }

  static async transcribeVoiceRecording(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const recordingId = req.params.id;
      const userId = req.user!.id;

      const voiceRecording = await prisma.voiceRecording.findFirst({
        where: {
          id: recordingId,
          userId,
        },
      });

      if (!voiceRecording) {
        const response: ApiResponse = {
          success: false,
          error: 'Voice recording not found',
        };
        res.status(404).json(response);
        return;
      }

      if (voiceRecording.transcription) {
        const response: ApiResponse = {
          success: true,
          data: {
            transcription: voiceRecording.transcription,
          },
        };
        res.json(response);
        return;
      }

      // For now, return a placeholder - in a real implementation, you would:
      // 1. Download the file from S3
      // 2. Use a speech-to-text service (OpenAI Whisper, Google Speech-to-Text, etc.)
      // 3. Update the database with the transcription

      const response: ApiResponse = {
        success: false,
        error: 'Transcription service not yet implemented',
        data: {
          placeholder: 'Transcription functionality will be implemented with OpenAI Whisper API',
        },
      };

      res.status(501).json(response);
    } catch (error) {
      console.error('Transcribe voice recording error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to transcribe voice recording',
      };
      res.status(500).json(response);
    }
  }
}