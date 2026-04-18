# 🚀 Quick Setup Guide for UnlimitedHealth Domain

Your Docker API is already running perfectly! Now let's connect your domain `unlimtedhealth.com`.

## 📋 Prerequisites

✅ **Docker containers are running** (API on port 3000, DB on port 5433)  
✅ **API is working** (tested and healthy)  
✅ **Server IP**: `217.21.78.192`

## 🌐 Step 1: Configure DNS

Go to your domain registrar (where you bought `unlimtedhealth.com`) and add these DNS records:

### A Records:
```
api.unlimtedhealth.com    → 217.21.78.192
app.unlimtedhealth.com    → 217.21.78.192
www.unlimtedhealth.com    → 217.21.78.192
unlimtedhealth.com        → 217.21.78.192
```

### Optional CNAME Records:
```
*.unlimtedhealth.com      → unlimtedhealth.com
```

## 🔧 Step 2: Wait for DNS Propagation

DNS changes can take 5-60 minutes to propagate. You can check with:

```bash
# Check if DNS is propagated
nslookup api.unlimtedhealth.com
nslookup app.unlimtedhealth.com
```

## 🚀 Step 3: Run the Domain Setup Script

Once DNS is propagated, run:

```bash
# Make sure you're in the project directory
cd /home/websites/healthcare-backend

# Run the domain setup script
./deploy-domain.sh
```

This script will:
- ✅ Install Nginx and SSL certificates
- ✅ Configure domain routing to your Docker containers
- ✅ Set up automatic SSL renewal
- ✅ Create health checks and backups
- ✅ Configure firewall

## 🎯 Step 4: Test Your Setup

After running the script, test your endpoints:

```bash
# Test API health
curl https://api.unlimtedhealth.com/health

# Test API documentation
curl https://api.unlimtedhealth.com/docs

# Test main API endpoint
curl https://api.unlimtedhealth.com/api/auth/login
```

## 📱 Step 5: Configure Your Frontend Apps

### For Expo App:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://api.unlimtedhealth.com/api';
```

### For Web App:
```javascript
const API_BASE_URL = 'https://api.unlimtedhealth.com/api';
```

## 🔍 Troubleshooting

### If DNS isn't working:
```bash
# Check DNS propagation
nslookup api.unlimtedhealth.com

# If it shows NXDOMAIN, wait longer or check DNS settings
```

### If SSL certificate fails:
```bash
# Check if domain resolves
ping api.unlimtedhealth.com

# Manual SSL setup
certbot --nginx -d api.unlimtedhealth.com --non-interactive --agree-tos --email your-email@example.com
```

### If API isn't accessible:
```bash
# Check Docker containers
docker ps

# Check API logs
docker logs healthcare-backend-api-1

# Restart containers
docker compose restart
```

## 🎉 Success!

Once everything is working, your API will be accessible at:

- **API Base URL**: `https://api.unlimtedhealth.com/api`
- **Documentation**: `https://api.unlimtedhealth.com/docs`
- **Health Check**: `https://api.unlimtedhealth.com/health`
- **Web App**: `https://app.unlimtedhealth.com`

## 📊 Monitoring Commands

```bash
# Check API health
curl https://api.unlimtedhealth.com/health

# View API logs
docker logs healthcare-backend-api-1

# View database logs
docker logs healthcare-backend-postgres-1

# Check SSL status
certbot certificates

# Database backup
/root/backup-db-docker.sh
```

Your UnlimitedHealth API will be ready for production! 🚀 