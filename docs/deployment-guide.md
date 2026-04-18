
# UNLIMITEDHEALTHCARE API Deployment Guide

## Overview

This guide covers the deployment process for the UNLIMITEDHEALTHCARE API across different environments.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Docker and Docker Compose
- Git
- Domain name with SSL certificate (for production)

## Environment Setup

### Development Environment

1. **Database Setup**
   ```bash
   # Using Docker
   docker run --name postgres-dev \
     -e POSTGRES_DB=healthcare_dev \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     -d postgres:13
   ```

2. **Environment Variables**
   Create `.env` file:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=healthcare_dev
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   FRONTEND_URL=http://localhost:3000
   ```

3. **Installation and Setup**
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run start:dev
   ```

### Staging Environment

1. **Infrastructure Setup**
   ```bash
   # Docker Compose for staging
   docker-compose -f docker-compose.staging.yml up -d
   ```

2. **Environment Configuration**
   ```env
   NODE_ENV=staging
   PORT=3000
   DATABASE_HOST=staging-db.internal
   DATABASE_PORT=5432
   DATABASE_USERNAME=api_user
   DATABASE_PASSWORD=secure_staging_password
   DATABASE_NAME=healthcare_staging
   JWT_SECRET=staging_jwt_secret
   JWT_REFRESH_SECRET=staging_refresh_secret
   FRONTEND_URL=https://staging.unlimitedhealthcare.com
   REDIS_URL=redis://staging-redis:6379
   EMAIL_SERVICE_API_KEY=staging_email_key
   SMS_SERVICE_API_KEY=staging_sms_key
   ```

3. **SSL Certificate Setup**
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d api-staging.unlimitedhealthcare.com
   ```

### Production Environment

1. **Infrastructure Requirements**
   - Load Balancer (AWS ALB, NGINX, or Cloudflare)
   - Database cluster with read replicas
   - Redis cluster for caching and sessions
   - CDN for static assets
   - Monitoring and alerting (DataDog, New Relic, etc.)

2. **Database Migration Strategy**
   ```bash
   # Backup current database
   pg_dump -h production-db -U api_user healthcare_prod > backup.sql
   
   # Run migrations
   npm run db:migrate
   
   # Verify migration success
   npm run test:integration
   ```

3. **Production Deployment**
   ```bash
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   
   # Or using Docker
   docker-compose -f docker-compose.production.yml up -d
   ```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."
```

## Monitoring and Alerting

### Health Check Endpoints

- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/metrics` - Prometheus metrics

### Key Metrics to Monitor

1. **Application Metrics**
   - Response time (p95, p99)
   - Error rate
   - Request volume
   - Memory usage
   - CPU usage

2. **Database Metrics**
   - Connection pool utilization
   - Query performance
   - Lock waits
   - Replication lag

3. **Business Metrics**
   - Active users
   - Appointment bookings
   - Chat messages sent
   - Video conference sessions

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: DatabaseConnectionIssue
        expr: db_connections_active > db_connections_max * 0.8
        for: 2m
        labels:
          severity: warning
```

## Security Considerations

### API Security
- JWT token validation
- Rate limiting per endpoint
- Input validation and sanitization
- SQL injection protection
- CORS configuration

### Infrastructure Security
- VPC with private subnets
- Security groups and NACLs
- SSL/TLS encryption
- Database encryption at rest
- Regular security updates

### Compliance
- HIPAA compliance for medical data
- GDPR compliance for EU users
- SOC 2 Type II certification
- Regular penetration testing

## Backup and Recovery

### Database Backups
```bash
# Daily automated backup
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://healthcare-backups/
```

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Strategy**: 
   - Continuous database replication
   - Daily full backups
   - Point-in-time recovery capability

## Performance Optimization

### Database Optimization
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas for read-heavy operations

### Application Optimization
- Redis caching
- CDN for static assets
- Image optimization
- API response compression

### Scaling Strategy
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture for specific modules
- Auto-scaling based on metrics

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   ```bash
   # Check connection pool
   SELECT * FROM pg_stat_activity;
   
   # Increase pool size in configuration
   ```

2. **High Memory Usage**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Restart application if needed
   pm2 restart all
   ```

3. **SSL Certificate Expiry**
   ```bash
   # Check certificate expiry
   openssl x509 -in cert.pem -text -noout | grep "Not After"
   
   # Renew certificate
   certbot renew
   ```

## Support Contacts

- **DevOps Team**: devops@unlimitedhealthcare.com
- **Database Admin**: dba@unlimitedhealthcare.com
- **Security Team**: security@unlimitedhealthcare.com
- **On-call**: +1-555-ONCALL (24/7)
