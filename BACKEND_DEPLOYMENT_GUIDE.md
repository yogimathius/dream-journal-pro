# Dream Journal Pro Backend - Deployment Guide

## 🚀 Deployment Checklist

### Prerequisites Setup

- [ ] PostgreSQL database (Heroku, Supabase, or managed service)
- [ ] AWS S3 bucket for voice recordings
- [ ] OpenAI API account and key
- [ ] Stripe account with products/prices configured
- [ ] Expo account for push notifications
- [ ] Fly.io account (or preferred hosting platform)

### Environment Configuration

Create production environment variables:

```bash
# Required Environment Variables
DATABASE_URL="postgresql://user:pass@host:port/dbname"
JWT_SECRET="generate-256-bit-random-string"
OPENAI_API_KEY="sk-your-openai-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-key"  # Use live key for production
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-bucket-name"
EXPO_ACCESS_TOKEN="your-expo-token"
NODE_ENV="production"
PORT="3000"
```

### Stripe Setup

1. Create products in Stripe Dashboard:
   - Free Plan (for reference)
   - Premium Monthly ($6.99/month)
   - Premium Annual ($59.99/year)

2. Configure webhook endpoint:
   - URL: `https://your-domain.com/api/subscriptions/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### Database Migration

1. **Set up production database**:
```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

2. **Verify schema**:
```bash
npx prisma studio
```

### Fly.io Deployment

1. **Install Fly CLI and authenticate**:
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

2. **Initialize and configure**:
```bash
fly launch
```

3. **Set secrets**:
```bash
fly secrets set DATABASE_URL="your-production-db-url"
fly secrets set JWT_SECRET="your-jwt-secret"
fly secrets set OPENAI_API_KEY="your-openai-key"
fly secrets set STRIPE_SECRET_KEY="your-stripe-secret"
fly secrets set STRIPE_WEBHOOK_SECRET="your-webhook-secret"
fly secrets set AWS_ACCESS_KEY_ID="your-aws-key"
fly secrets set AWS_SECRET_ACCESS_KEY="your-aws-secret"
fly secrets set AWS_S3_BUCKET="your-bucket-name"
fly secrets set EXPO_ACCESS_TOKEN="your-expo-token"
```

4. **Deploy**:
```bash
fly deploy
```

### Post-Deployment Verification

1. **Health check**:
```bash
curl https://your-app.fly.dev/health
```

2. **API endpoints**:
```bash
curl https://your-app.fly.dev/api
```

3. **Test user registration**:
```bash
curl -X POST https://your-app.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

### Monitoring & Maintenance

1. **View logs**:
```bash
fly logs
```

2. **Scale app**:
```bash
fly scale count 2  # Scale to 2 instances
fly scale memory 512  # Scale to 512MB memory
```

3. **Database backups**:
Set up automated backups for your PostgreSQL instance

4. **SSL/TLS**:
Fly.io provides automatic HTTPS certificates

### Security Considerations

- [ ] JWT secret is cryptographically secure (256-bit)
- [ ] Database uses SSL connections
- [ ] API rate limiting is enabled
- [ ] CORS is configured for production domains
- [ ] Environment variables are properly secured
- [ ] S3 bucket has proper access policies
- [ ] Stripe webhooks use signature verification

### Performance Optimization

- [ ] Database indexes are optimized
- [ ] API responses are compressed
- [ ] Static assets are cached
- [ ] Connection pooling is configured
- [ ] Monitoring and alerts are set up

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure PostgreSQL version compatibility

2. **OpenAI API Rate Limits**
   - Implement exponential backoff
   - Monitor usage quotas
   - Consider caching responses

3. **S3 Upload Failures**
   - Verify AWS credentials and permissions
   - Check bucket CORS configuration
   - Validate file size limits

4. **Stripe Webhook Issues**
   - Verify webhook signature validation
   - Check endpoint URL accessibility
   - Monitor webhook delivery attempts

### Performance Monitoring

```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s "https://your-app.fly.dev/health"

# Check memory usage
fly ssh console -C "free -h"

# Database performance
fly ssh console -C "npm run prisma:studio"
```

## 📊 Success Metrics

### Technical Metrics
- API response time < 200ms (95th percentile)
- Uptime > 99.9%
- Database query time < 100ms average
- Error rate < 0.1%

### Business Metrics
- User registration conversion > 10%
- Free to Premium conversion > 15%
- Dream analysis completion rate > 90%
- Push notification open rate > 20%

### Scaling Thresholds
- Scale to 2 instances at 100 concurrent users
- Scale to 4 instances at 500 concurrent users
- Consider database scaling at 10,000+ users

## 🚨 Incident Response

### Critical Issues
1. Database connection failures
2. Payment processing errors
3. Data corruption or loss
4. Security breaches

### Response Plan
1. Immediate: Check status page and logs
2. Within 5 min: Scale resources if needed
3. Within 15 min: Notify stakeholders
4. Within 1 hour: Implement fix or rollback
5. Post-incident: Document and improve

## 📈 Future Enhancements

### Planned Features
- [ ] Voice transcription with OpenAI Whisper
- [ ] Advanced pattern recognition with ML
- [ ] Social dream sharing features
- [ ] Integration with sleep tracking devices
- [ ] Multi-language support
- [ ] Web dashboard for dream analytics

### Technical Improvements
- [ ] GraphQL API implementation
- [ ] Real-time WebSocket connections
- [ ] Advanced caching with Redis
- [ ] Microservices architecture
- [ ] Advanced monitoring and alerting
- [ ] Automated testing pipeline

## 📞 Support

For deployment issues:
- Check Fly.io documentation: https://fly.io/docs/
- Review application logs: `fly logs`
- Contact support: support@dreamjournalpro.com

## 🎯 Success Confirmation

✅ **Backend is successfully deployed when:**
- All API endpoints return expected responses
- Database migrations are applied
- User registration and authentication work
- Dream creation and analysis function
- Push notifications are delivered
- Stripe payments process correctly
- Health checks pass consistently
- SSL certificates are valid
- Monitoring dashboards show green status