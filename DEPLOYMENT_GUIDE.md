# 🚀 UnlimitedHealth API Deployment Guide

This guide will help you deploy your healthcare API to `unlimtedhealth.com` and configure it for both Expo mobile app and web app usage.

## 📋 Prerequisites

Before starting, ensure you have:

- A VPS or cloud server (Ubuntu 20.04+ recommended)
- Domain `unlimtedhealth.com` with DNS access
- SSH access to your server
- Basic knowledge of Linux commands

## 🌐 Domain Setup

### 1. DNS Configuration

Configure your domain's DNS records:

```bash
# A Records
api.unlimtedhealth.com    → YOUR_SERVER_IP
app.unlimtedhealth.com    → YOUR_SERVER_IP
www.unlimtedhealth.com    → YOUR_SERVER_IP
unlimtedhealth.com        → YOUR_SERVER_IP

# CNAME Records (optional)
*.unlimtedhealth.com      → unlimtedhealth.com
```

### 2. Verify DNS Propagation

```bash
# Check if DNS is propagated
nslookup api.unlimtedhealth.com
nslookup app.unlimtedhealth.com
nslookup www.unlimtedhealth.com
```

## 🖥️ Server Setup

### 1. Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Run the Deployment Script

```bash
# Upload your project files to the server
scp -r ./* root@YOUR_SERVER_IP:/tmp/unlimitedhealth/

# SSH into your server
ssh root@YOUR_SERVER_IP

# Navigate to the uploaded files
cd /tmp/unlimitedhealth/

# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### 3. Manual Configuration (if needed)

If the automated script doesn't work, follow these steps:

#### Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install other dependencies
apt install -y nginx postgresql redis-server certbot python3-certbot-nginx

# Install PM2 globally
npm install -g pm2
```

#### Set Up Database

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER unlimitedhealth WITH PASSWORD 'your_secure_password';
CREATE DATABASE unlimitedhealthcare_prod OWNER unlimitedhealth;
GRANT ALL PRIVILEGES ON DATABASE unlimitedhealthcare_prod TO unlimitedhealth;
\q
EOF
```

#### Configure Environment

```bash
# Copy environment file
cp env.example .env

# Edit the environment file
nano .env
```

Update the `.env` file with your production settings:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=unlimitedhealth
DB_PASSWORD=your_secure_password
DB_DATABASE=unlimitedhealthcare_prod

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@unlimtedhealth.com

# Frontend URLs
FRONTEND_URL=https://app.unlimtedhealth.com
WEB_APP_URL=https://www.unlimtedhealth.com
```

#### Set Up Nginx

```bash
# Copy Nginx configuration
cp nginx.conf /etc/nginx/sites-available/unlimtedhealth.com

# Enable the site
ln -sf /etc/nginx/sites-available/unlimtedhealth.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

#### Set Up SSL Certificates

```bash
# Install SSL certificates
certbot --nginx -d api.unlimtedhealth.com -d app.unlimtedhealth.com -d www.unlimtedhealth.com -d unlimtedhealth.com --non-interactive --agree-tos --email admin@unlimtedhealth.com
```

#### Deploy the Application

```bash
# Install dependencies
npm install --production

# Build the application
npm run build

# Run database migrations
npm run migration:run

# Start the application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📱 Frontend Configuration

### For Expo App

Create a configuration file in your Expo project:

```javascript
// config/api.js
const ENV = __DEV__ ? 'development' : 'production';

const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    WEB_SOCKET_URL: 'ws://localhost:3000',
  },
  production: {
    API_BASE_URL: 'https://api.unlimtedhealth.com/api',
    WEB_SOCKET_URL: 'wss://api.unlimtedhealth.com',
  },
};

export const API_CONFIG = config[ENV];

// API service
export const apiService = {
  baseURL: API_CONFIG.API_BASE_URL,
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await AsyncStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Authentication
  login: (credentials) => apiService.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiService.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Patients
  getPatients: () => apiService.request('/patients'),
  createPatient: (patientData) => apiService.request('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),
  
  // Appointments
  getAppointments: () => apiService.request('/appointments'),
  createAppointment: (appointmentData) => apiService.request('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),
  
  // Medical Records
  getMedicalRecords: () => apiService.request('/medical-records'),
  createMedicalRecord: (recordData) => apiService.request('/medical-records', {
    method: 'POST',
    body: JSON.stringify(recordData),
  }),
};
```

### For Web App

Use the provided `frontend-config.js` file:

```javascript
// In your web app
import { getApiUrl, API_ENDPOINTS } from './frontend-config.js';

// Example usage
const loginUser = async (credentials) => {
  const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return response.json();
};

const getPatients = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(getApiUrl(API_ENDPOINTS.PATIENTS.LIST), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

## 🔧 Testing Your Deployment

### 1. Health Check

```bash
# Test the health endpoint
curl https://api.unlimtedhealth.com/health
```

### 2. API Documentation

Visit: `https://api.unlimtedhealth.com/docs`

### 3. Test API Endpoints

```bash
# Test authentication
curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoint
curl -X GET https://api.unlimtedhealth.com/api/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Monitoring and Maintenance

### 1. View Logs

```bash
# Application logs
pm2 logs unlimitedhealth-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### 2. Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

### 3. Backup Database

```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/unlimitedhealth"
mkdir -p $BACKUP_DIR

pg_dump -U unlimitedhealth unlimitedhealthcare_prod > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db.sh") | crontab -
```

### 4. SSL Certificate Renewal

```bash
# Test SSL renewal
certbot renew --dry-run

# SSL certificates auto-renew via cron (already set up by deploy script)
```

## 🚨 Troubleshooting

### Common Issues

1. **Nginx 502 Bad Gateway**
   ```bash
   # Check if the app is running
   pm2 status
   
   # Check app logs
   pm2 logs unlimitedhealth-api
   
   # Restart the app
   pm2 restart unlimitedhealth-api
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   certbot certificates
   
   # Renew certificates
   certbot renew
   ```

3. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   systemctl status postgresql
   
   # Test database connection
   sudo -u postgres psql -d unlimitedhealthcare_prod -c "SELECT 1;"
   ```

4. **CORS Issues**
   - Check the CORS configuration in `src/main.ts`
   - Ensure your frontend domain is in the allowed origins

### Performance Optimization

1. **Enable Gzip Compression** (already configured in nginx.conf)
2. **Set up Redis Caching** (already configured)
3. **Use CDN for static assets**
4. **Implement database connection pooling**

## 📈 Scaling Considerations

### Horizontal Scaling

```bash
# Set up load balancer
# Use multiple application instances
pm2 start ecosystem.config.js -i max
```

### Database Scaling

```bash
# Consider read replicas for PostgreSQL
# Set up database clustering
```

### CDN Setup

```bash
# Use Cloudflare or AWS CloudFront
# Configure for static assets and API caching
```

## 🔒 Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Strong passwords for all services
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] JWT secrets are secure
- [ ] API keys are protected

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs unlimitedhealth-api`
2. Test the health endpoint: `curl https://api.unlimtedhealth.com/health`
3. Verify DNS propagation: `nslookup api.unlimtedhealth.com`
4. Check SSL status: `certbot certificates`

## 🎉 Success!

Your API is now deployed and accessible at:
- **API Base URL**: `https://api.unlimtedhealth.com/api`
- **Documentation**: `https://api.unlimtedhealth.com/docs`
- **Health Check**: `https://api.unlimtedhealth.com/health`

Your frontend applications can now use these URLs to connect to your healthcare API! 