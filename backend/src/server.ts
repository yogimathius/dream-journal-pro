import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config/env';
import { connectDatabase, prisma } from './config/database';
import { ApiResponse } from './types';

// Import routes
import authRoutes from './routes/auth';
import dreamRoutes from './routes/dreams';
import voiceRoutes from './routes/voice';
import analysisRoutes from './routes/analysis';
import patternRoutes from './routes/patterns';
import syncRoutes from './routes/sync';
import notificationRoutes from './routes/notifications';
import subscriptionRoutes from './routes/subscriptions';

// Import services that need to be initialized
import { notificationService } from './services/notificationService';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://localhost:8081', 'exp://localhost:8081'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    },
  };
  res.json(response);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'Dream Journal Pro API',
      version: '1.0.0',
      description: 'AI-powered dream analysis and pattern recognition API',
      endpoints: {
        auth: '/api/auth',
        dreams: '/api/dreams',
        voice: '/api/voice',
        analysis: '/api/analysis',
        patterns: '/api/patterns',
        sync: '/api/sync',
        notifications: '/api/notifications',
        subscriptions: '/api/subscriptions',
      },
      documentation: 'https://docs.dreamjournalpro.com',
    },
  };
  res.json(response);
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', error);
  
  const response: ApiResponse = {
    success: false,
    error: env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
  };
  
  res.status(500).json(response);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize services (notification service initializes cron jobs)
    console.log('✅ Services initialized');
    
    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      console.log(`
🚀 Dream Journal Pro API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Environment: ${env.NODE_ENV}
📡 Port: ${env.PORT}
🔗 Local URL: http://localhost:${env.PORT}
📋 Health Check: http://localhost:${env.PORT}/health
📚 API Docs: http://localhost:${env.PORT}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${env.PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;