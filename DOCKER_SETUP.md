# 🐳 Docker Setup Guide for UnlimitedHealth API

This guide explains how to set up your UnlimitedHealth API with Docker database and deployment.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain `unlimtedhealth.com` configured
- Server with Docker support

## 🗄️ Database Setup with Docker

### Option 1: Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    container_name: unlimitedhealth-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: unlimitedhealthcare_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - unlimitedhealth-network

  redis:
    image: redis:7-alpine
    container_name: unlimitedhealth-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - unlimitedhealth-network

volumes:
  postgres_data:
  redis_data:

networks:
  unlimitedhealth-network:
    driver: bridge
```

Start the services:

```bash
# Start database and Redis
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs redis
```

### Option 2: Using Docker Run Commands

```bash
# Start PostgreSQL container
docker run -d \
  --name unlimitedhealth-db \
  --restart unless-stopped \
  -e POSTGRES_DB=unlimitedhealthcare_prod \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:13

# Start Redis container
docker run -d \
  --name unlimitedhealth-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine
```

## 🔧 Environment Configuration

Update your `.env` file for Docker:

```env
# Database Configuration (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_DATABASE=unlimitedhealthcare_prod

# Redis Configuration (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## 🚀 Deployment with Docker Database

### 1. Start Database First

```bash
# If using docker-compose
docker-compose up -d postgres redis

# If using docker run
docker start unlimitedhealth-db unlimitedhealth-redis
```

### 2. Verify Database Connection

```bash
# Check if containers are running
docker ps

# Test database connection
docker exec unlimitedhealth-db pg_isready -U postgres

# Connect to database
docker exec -it unlimitedhealth-db psql -U postgres -d unlimitedhealthcare_prod
```

### 3. Run the Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 📊 Database Management

### Backup Database

```bash
# Manual backup
docker exec unlimitedhealth-db pg_dump -U postgres unlimitedhealthcare_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Using the backup script
./backup-db-docker.sh
```

### Restore Database

```bash
# Restore from backup
docker exec -i unlimitedhealth-db psql -U postgres -d unlimitedhealthcare_prod < backup_file.sql
```

### Database Migrations

```bash
# Run migrations
npm run migration:run

# Generate new migration
npm run migration:generate -- -n MigrationName

# Revert last migration
npm run migration:revert
```

## 🔍 Monitoring Docker Containers

### Check Container Status

```bash
# List all containers
docker ps -a

# View container logs
docker logs unlimitedhealth-db
docker logs unlimitedhealth-redis

# Monitor resource usage
docker stats
```

### Health Checks

```bash
# Check database health
docker exec unlimitedhealth-db pg_isready -U postgres

# Check Redis health
docker exec unlimitedhealth-redis redis-cli ping
```

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs unlimitedhealth-db

# Restart container
docker restart unlimitedhealth-db

# Check network connectivity
docker exec unlimitedhealth-db ping localhost
```

### Port Conflicts

If port 5432 is already in use:

```bash
# Check what's using the port
sudo lsof -i :5432

# Stop conflicting service
sudo systemctl stop postgresql

# Or use different port mapping
docker run -d \
  --name unlimitedhealth-db \
  -p 5433:5432 \
  postgres:13
```

Then update your `.env` file:
```env
DB_PORT=5433
```

### Data Persistence

```bash
# Check volume usage
docker volume ls
docker volume inspect postgres_data

# Backup volume data
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## 🔒 Security Considerations

### Database Security

```bash
# Change default password
docker exec -it unlimitedhealth-db psql -U postgres
ALTER USER postgres PASSWORD 'new_secure_password';
\q

# Create dedicated user
docker exec -it unlimitedhealth-db psql -U postgres
CREATE USER unlimitedhealth WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE unlimitedhealthcare_prod TO unlimitedhealth;
\q
```

### Network Security

```bash
# Create custom network
docker network create unlimitedhealth-network

# Run containers on custom network
docker run -d \
  --name unlimitedhealth-db \
  --network unlimitedhealth-network \
  postgres:13
```

## 📈 Performance Optimization

### Database Optimization

```bash
# Increase shared buffers
docker run -d \
  --name unlimitedhealth-db \
  -e POSTGRES_SHARED_BUFFERS=256MB \
  postgres:13
```

### Redis Optimization

```bash
# Configure Redis for persistence
docker run -d \
  --name unlimitedhealth-redis \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes
```

## 🔄 Backup and Recovery

### Automated Backups

The deployment script creates an automated backup system:

```bash
# Manual backup
./backup-db-docker.sh

# Check backup files
ls -la /var/backups/unlimitedhealth/

# Restore from backup
gunzip -c /var/backups/unlimitedhealth/db_backup_20231201_120000.sql.gz | \
docker exec -i unlimitedhealth-db psql -U postgres -d unlimitedhealthcare_prod
```

### Disaster Recovery

```bash
# Stop all containers
docker-compose down

# Backup volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Restore on new server
docker volume create postgres_data
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
```

## 🎯 Production Checklist

- [ ] Database container is running and healthy
- [ ] Redis container is running and healthy
- [ ] Environment variables are configured correctly
- [ ] Database migrations have been run
- [ ] SSL certificates are installed
- [ ] Firewall is configured
- [ ] Automated backups are working
- [ ] Health checks are passing
- [ ] Monitoring is set up
- [ ] Logs are being collected

## 📞 Support Commands

```bash
# Quick health check
curl https://api.unlimtedhealth.com/health

# Check all containers
docker ps -a

# View application logs
pm2 logs unlimitedhealth-api

# Check database connection
docker exec unlimitedhealth-db pg_isready -U postgres

# Restart everything
docker-compose restart && pm2 restart unlimitedhealth-api
```

Your Docker-based UnlimitedHealth API is now ready for production! 🚀 