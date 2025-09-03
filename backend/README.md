# Dream Journal Pro - Backend API

AI-powered dream analysis and pattern recognition backend built with Node.js, Express, PostgreSQL, and OpenAI.

## 🚀 Features

- **JWT Authentication** - Secure user registration and login
- **Dream Management** - CRUD operations for dream entries with rich metadata
- **Voice Recording Storage** - AWS S3 integration for audio files
- **AI Dream Analysis** - OpenAI GPT-4 powered dream interpretation
- **Pattern Recognition** - Automatic detection of dream patterns and insights
- **Multi-device Sync** - Real-time synchronization across devices
- **Push Notifications** - Expo push notifications for dream reminders
- **Subscription System** - Stripe integration for premium features
- **Rate Limiting** - API protection with intelligent rate limiting

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3
- **AI Integration**: OpenAI GPT-4 API
- **Payments**: Stripe
- **Push Notifications**: Expo Server SDK
- **Deployment**: Fly.io with Docker

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- AWS S3 bucket
- OpenAI API key
- Stripe account
- Expo account (for push notifications)

## ⚙️ Environment Setup

1. **Clone and install dependencies**:
```bash
cd backend
npm install
```

2. **Create environment file**:
```bash
cp .env.example .env
```

3. **Configure environment variables** in `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dream_journal_pro"

# JWT
JWT_SECRET="your-super-secret-jwt-key-256-bits"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="dream-journal-voice-recordings"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Expo Push Notifications
EXPO_ACCESS_TOKEN="your-expo-access-token"

# Server
PORT=3000
NODE_ENV="development"
```

## 🗄 Database Setup

1. **Generate Prisma client**:
```bash
npm run prisma:generate
```

2. **Run database migrations**:
```bash
npm run prisma:migrate
```

3. **Seed database (optional)**:
```bash
npm run seed
```

## 🏃‍♂️ Running the Server

**Development mode**:
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Dreams
- `POST /api/dreams` - Create dream entry
- `GET /api/dreams` - List user dreams with search/filter
- `GET /api/dreams/:id` - Get specific dream
- `PUT /api/dreams/:id` - Update dream
- `DELETE /api/dreams/:id` - Delete dream
- `GET /api/dreams/stats` - Get dream statistics

### Voice Recordings
- `POST /api/voice/upload` - Upload voice recording
- `GET /api/voice` - List voice recordings
- `GET /api/voice/:id` - Get specific recording
- `DELETE /api/voice/:id` - Delete recording

### AI Analysis
- `POST /api/analysis/dreams/:dreamId/analyze` - Analyze dream with AI
- `GET /api/analysis/dreams/:dreamId` - Get dream analysis
- `GET /api/analysis` - List user analyses
- `POST /api/analysis/extract-symbols` - Extract symbols from text

### Pattern Recognition (Premium)
- `GET /api/patterns` - Get user dream patterns
- `GET /api/patterns/:id` - Get specific pattern details
- `PUT /api/patterns/:id` - Update pattern
- `DELETE /api/patterns/:id` - Delete pattern

### Multi-device Sync
- `GET /api/sync/status` - Get sync status
- `GET /api/sync/updates` - Get updates since timestamp
- `POST /api/sync/batch` - Batch sync operations

### Push Notifications
- `POST /api/notifications/register-token` - Register push token
- `PUT /api/notifications/settings` - Update notification settings
- `GET /api/notifications/history` - Get notification history

### Subscriptions
- `GET /api/subscriptions/prices` - Get available pricing plans
- `GET /api/subscriptions/status` - Get user subscription status
- `POST /api/subscriptions/create` - Create new subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/webhook` - Stripe webhook handler

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Rate Limiting

API endpoints are protected with rate limiting:
- General API: 100 requests per 15 minutes
- Authentication: 10 requests per 15 minutes
- File uploads: 5 requests per minute
- AI analysis: 10 requests per hour

## 🎯 Subscription Tiers

### Free Tier
- 5 dream entries per month
- Basic dream storage
- Voice recordings
- Symbol extraction

### Premium Tier ($6.99/month)
- Unlimited dream entries
- AI-powered dream analysis
- Pattern recognition and insights
- Advanced search and filtering
- Priority customer support

## 🚀 Deployment

### Fly.io Deployment

1. **Install Fly CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly.io**:
```bash
fly auth login
```

3. **Deploy the application**:
```bash
fly launch
```

4. **Set environment variables**:
```bash
fly secrets set DATABASE_URL="your-production-database-url"
fly secrets set JWT_SECRET="your-production-jwt-secret"
fly secrets set OPENAI_API_KEY="your-openai-api-key"
# ... set all other environment variables
```

5. **Deploy updates**:
```bash
fly deploy
```

### Database Migration on Production

```bash
fly ssh console
npx prisma migrate deploy
```

## 📝 Development Guidelines

### Code Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/          # Data models (Prisma handles this)
├── routes/          # API routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Main application entry point
```

### Adding New Features

1. **Create database schema** in `prisma/schema.prisma`
2. **Run migration**: `npm run prisma:migrate`
3. **Create service** in `src/services/`
4. **Create controller** in `src/controllers/`
5. **Create routes** in `src/routes/`
6. **Add validation** using Joi schemas
7. **Add tests** (recommended)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring & Logs

### Health Check
```bash
curl http://localhost:3000/health
```

### API Documentation
```bash
curl http://localhost:3000/api
```

### Production Logs
```bash
fly logs
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in environment variables
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **OpenAI API Errors**
   - Check OPENAI_API_KEY is valid
   - Verify API quota and billing
   - Check rate limits

3. **S3 Upload Failures**
   - Verify AWS credentials and permissions
   - Check S3 bucket exists and is accessible
   - Validate file types and sizes

4. **Stripe Webhook Issues**
   - Verify webhook endpoint URL in Stripe dashboard
   - Check STRIPE_WEBHOOK_SECRET matches Stripe configuration
   - Ensure webhook events are properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Email: support@dreamjournalpro.com
- Documentation: https://docs.dreamjournalpro.com