#!/bin/bash
set -e

# SSL certificate setup script using Let's Encrypt

DOMAIN=${1}
EMAIL=${2}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    log_error "Usage: $0 <domain> <email>"
    echo "Example: $0 api.example.com admin@example.com"
    exit 1
fi

log_info "Setting up SSL certificate for ${DOMAIN}..."

# Check if certbot is running
if ! docker ps | grep -q certbot; then
    log_info "Starting certbot container..."
    docker-compose -f docker-compose.prod.yml up -d certbot
fi

# Create SSL certificate directory
mkdir -p nginx/ssl

# Request certificate
log_info "Requesting Let's Encrypt certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d ${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email

if [ $? -eq 0 ]; then
    log_info "Certificate obtained successfully!"
    
    # Create symlinks
    log_info "Creating certificate symlinks..."
    ln -sf /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/cert.pem
    ln -sf /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/key.pem
    
    # Reload nginx
    log_info "Reloading Nginx..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    log_info "SSL setup complete!"
    log_info "Certificate will auto-renew via certbot container"
else
    log_error "Failed to obtain certificate"
    exit 1
fi

# Test certificate
log_info "Testing certificate..."
openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} </dev/null 2>/dev/null | openssl x509 -noout -dates

log_info "Setup completed successfully!"
