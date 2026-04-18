#!/bin/bash

# UnlimitedHealth Domain Setup Script
# This script sets up the domain and SSL for your existing Docker API

set -e

echo "🚀 Starting UnlimitedHealth domain setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="unlimtedhealth.com"
API_SUBDOMAIN="api.unlimtedhealth.com"
WEB_SUBDOMAIN="app.unlimtedhealth.com"
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

print_status "Checking Docker containers..."
if ! docker ps | grep -q "healthcare-backend-api-1"; then
    print_error "API container not found. Please start your Docker containers first:"
    print_error "docker compose up -d"
    exit 1
fi

if ! docker ps | grep -q "healthcare-backend-postgres-1"; then
    print_error "Database container not found. Please start your Docker containers first:"
    print_error "docker compose up -d"
    exit 1
fi

print_status "Docker containers are running ✅"

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx

print_status "Creating initial Nginx configuration (without SSL)..."
# Create a temporary Nginx config without SSL
cat > /tmp/nginx-temp.conf << 'EOF'
# Temporary Nginx configuration without SSL
upstream unlimitedhealth_api {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.unlimtedhealth.com app.unlimtedhealth.com www.unlimtedhealth.com unlimtedhealth.com;
    
    location /api/ {
        proxy_pass http://unlimitedhealth_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    location /health {
        proxy_pass http://unlimitedhealth_api/api/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /docs {
        proxy_pass http://unlimitedhealth_api/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api-json {
        proxy_pass http://unlimitedhealth_api/api/api-json;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

print_status "Setting up initial Nginx configuration..."
cp /tmp/nginx-temp.conf $NGINX_SITE

# Enable the site
ln -sf $NGINX_SITE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

print_status "Testing initial Nginx configuration..."
nginx -t

print_status "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

print_status "Setting up SSL certificates..."
certbot --nginx -d $API_SUBDOMAIN -d $WEB_SUBDOMAIN -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

print_status "Setting up final Nginx configuration with SSL..."
cp nginx.conf $NGINX_SITE

print_status "Testing final Nginx configuration..."
nginx -t

print_status "Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_status "Reloading Nginx..."
systemctl reload nginx

print_status "Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

print_status "Creating health check script..."
cat > /root/health-check-docker.sh << 'EOF'
#!/bin/bash
# Check API health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "API is healthy"
else
    echo "API is down, restarting Docker containers..."
    cd /home/websites/healthcare-backend
    docker compose restart api
fi

# Check database health
if docker exec healthcare-backend-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo "Database is healthy"
else
    echo "Database is down, restarting..."
    cd /home/websites/healthcare-backend
    docker compose restart postgres
fi
EOF

chmod +x /root/health-check-docker.sh

# Add health check to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/health-check-docker.sh") | crontab -

print_status "Creating database backup script..."
cat > /root/backup-db-docker.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/unlimitedhealth"
mkdir -p $BACKUP_DIR

# Create backup from Docker container
docker exec healthcare-backend-postgres-1 pg_dump -U postgres healthcare > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /root/backup-db-docker.sh

# Add database backup to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db-docker.sh") | crontab -

# Clean up temporary file
rm -f /tmp/nginx-temp.conf

print_status "Domain setup completed successfully! 🎉"

echo ""
echo "📋 Your API is now accessible at:"
echo "   - API: https://$API_SUBDOMAIN"
echo "   - Documentation: https://$API_SUBDOMAIN/docs"
echo "   - Health Check: https://$API_SUBDOMAIN/health"
echo ""
echo "📱 For your Expo app, use: https://$API_SUBDOMAIN/api"
echo "🌍 For your web app, use: https://$WEB_SUBDOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "   - View API logs: docker logs healthcare-backend-api-1"
echo "   - View DB logs: docker logs healthcare-backend-postgres-1"
echo "   - Restart API: docker compose restart api"
echo "   - Restart DB: docker compose restart postgres"
echo "   - Nginx status: systemctl status nginx"
echo "   - SSL status: certbot certificates"
echo "   - Database backup: /root/backup-db-docker.sh"
echo ""
echo "🐳 Docker Commands:"
echo "   - Check containers: docker ps"
echo "   - View all logs: docker compose logs"
echo "   - Restart everything: docker compose restart"
echo "   - Connect to DB: docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare"
echo ""
echo "✅ Your existing Docker setup is now accessible via your domain!" 