#!/bin/bash

# UnlimitedHealth API Deployment Script
# This script sets up the production environment for unlimtedhealth.com

set -e

echo "🚀 Starting UnlimitedHealth API deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="unlimtedhealth.com"
API_SUBDOMAIN="api.unlimtedhealth.com"
WEB_SUBDOMAIN="app.unlimtedhealth.com"
APP_DIR="/var/www/unlimtedhealth"
NGINX_SITE="/etc/nginx/sites-available/unlimtedhealth.com"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx nodejs npm redis-server docker.io docker-compose

print_status "Creating application directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/static
mkdir -p $APP_DIR/web-app

print_status "Setting up Node.js application..."
cd $APP_DIR

# Copy application files (assuming they're in the current directory)
if [ -d "./src" ]; then
    cp -r ./* $APP_DIR/
else
    print_error "Application files not found in current directory"
    exit 1
fi

print_status "Installing Node.js dependencies..."
cd $APP_DIR
npm install --production

print_status "Building the application..."
npm run build

print_status "Setting up environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp env.example $APP_DIR/.env
    print_warning "Please configure the .env file with your production settings"
    print_warning "Make sure to update database connection settings for Docker"
fi

print_status "Checking Docker database connection..."
# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "postgres\|database"; then
    print_warning "Database container not found. Please ensure your database is running in Docker."
    print_warning "You can start it with: docker-compose up -d"
fi

print_status "Setting up Nginx configuration..."
cp nginx.conf $NGINX_SITE

# Enable the site
ln -sf $NGINX_SITE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

print_status "Testing Nginx configuration..."
nginx -t

print_status "Setting up SSL certificates..."
certbot --nginx -d $API_SUBDOMAIN -d $WEB_SUBDOMAIN -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

print_status "Setting up PM2 for process management..."
npm install -g pm2

print_status "Creating PM2 ecosystem file..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'unlimitedhealth-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

print_status "Setting up log rotation..."
cat > /etc/logrotate.d/unlimitedhealth << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

print_status "Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_status "Setting up Redis..."
systemctl enable redis-server
systemctl start redis-server

print_status "Creating Docker database helper script..."
cat > $APP_DIR/docker-db-check.sh << 'EOF'
#!/bin/bash
# Check if database container is running and accessible
if docker ps | grep -q "postgres\|database"; then
    echo "Database container is running"
    
    # Try to connect to database (adjust connection details as needed)
    if docker exec $(docker ps -q --filter "name=postgres") pg_isready -U postgres > /dev/null 2>&1; then
        echo "Database connection successful"
        exit 0
    else
        echo "Database connection failed"
        exit 1
    fi
else
    echo "Database container not found"
    exit 1
fi
EOF

chmod +x $APP_DIR/docker-db-check.sh

print_status "Starting the application..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_status "Reloading Nginx..."
systemctl reload nginx

print_status "Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

print_status "Creating health check script..."
cat > $APP_DIR/health-check.sh << 'EOF'
#!/bin/bash
# Check API health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "API is healthy"
else
    echo "API is down, restarting..."
    pm2 restart unlimitedhealth-api
fi

# Check database connection
if [ -f "/var/www/unlimtedhealth/docker-db-check.sh" ]; then
    if ! /var/www/unlimtedhealth/docker-db-check.sh; then
        echo "Database connection failed"
        # You might want to restart the database container here
        # docker restart your-database-container-name
    fi
fi
EOF

chmod +x $APP_DIR/health-check.sh

# Add health check to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/health-check.sh") | crontab -

print_status "Creating database backup script for Docker..."
cat > $APP_DIR/backup-db-docker.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/unlimitedhealth"
mkdir -p $BACKUP_DIR

# Find the database container
DB_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(postgres|database)" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "No database container found"
    exit 1
fi

# Create backup (adjust credentials as needed)
docker exec $DB_CONTAINER pg_dump -U postgres unlimitedhealthcare_prod > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x $APP_DIR/backup-db-docker.sh

# Add database backup to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup-db-docker.sh") | crontab -

print_status "Deployment completed successfully! 🎉"

echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with Docker database settings:"
echo "   DB_HOST=localhost (or your Docker host IP)"
echo "   DB_PORT=5432 (or your Docker port mapping)"
echo "   DB_USERNAME=postgres (or your Docker database user)"
echo "   DB_PASSWORD=your_docker_db_password"
echo "   DB_DATABASE=unlimitedhealthcare_prod"
echo ""
echo "2. Ensure your Docker database is running:"
echo "   docker-compose up -d"
echo "   # or"
echo "   docker run -d --name postgres-db -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=unlimitedhealthcare_prod -p 5432:5432 postgres:13"
echo ""
echo "3. Run database migrations:"
echo "   npm run migration:run"
echo ""
echo "4. Test your API endpoints"
echo "5. Set up monitoring and alerts"
echo ""
echo "🌐 Your API will be available at:"
echo "   - API: https://$API_SUBDOMAIN"
echo "   - Documentation: https://$API_SUBDOMAIN/docs"
echo "   - Health Check: https://$API_SUBDOMAIN/health"
echo ""
echo "📱 For your Expo app, use: https://$API_SUBDOMAIN/api"
echo "🌍 For your web app, use: https://$WEB_SUBDOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: pm2 logs unlimitedhealth-api"
echo "   - Restart app: pm2 restart unlimitedhealth-api"
echo "   - Monitor: pm2 monit"
echo "   - Nginx status: systemctl status nginx"
echo "   - SSL status: certbot certificates"
echo "   - Docker containers: docker ps"
echo "   - Database backup: $APP_DIR/backup-db-docker.sh"
echo ""
echo "🐳 Docker Database Commands:"
echo "   - Check database container: docker ps | grep postgres"
echo "   - View database logs: docker logs your-db-container-name"
echo "   - Connect to database: docker exec -it your-db-container-name psql -U postgres"
echo "   - Restart database: docker restart your-db-container-name" 