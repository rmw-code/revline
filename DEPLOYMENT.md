# Deployment Guide for RevLine Frontend

## Build Completed ✓
Your production build is ready in the `dist/` folder.

## Server Information
- **Server OS**: AlmaLinux
- **Domain**: billing.revlinemotorworks.com
- **Web Server**: Apache (httpd)
- **Deploy Directory**: /opt/revline/fe/static
- **Port**: 80 (via Cloudflare)

## Deployment Steps

### 1. Transfer Build Files to Server

From your local machine, upload the dist folder contents:

```bash
# Option A: Using rsync (recommended)
rsync -avz --delete dist/ user@your-server:/opt/revline/fe/static/

# Option B: Using scp
scp -r dist/* user@your-server:/opt/revline/fe/static/

# Option C: Create tarball and transfer
tar -czf revline-fe.tar.gz -C dist .
scp revline-fe.tar.gz user@your-server:/tmp/
```

### 2. On Your AlmaLinux Server

SSH into your server and run:

```bash
# If you used tarball method:
cd /opt/revline/fe/static
tar -xzf /tmp/revline-fe.tar.gz
rm /tmp/revline-fe.tar.gz

# Set proper permissions
sudo chown -R apache:apache /opt/revline/fe/static
sudo chmod -R 755 /opt/revline/fe/static
```

### 3. Configure Apache

Copy the Apache configuration file to your server:

```bash
# On your local machine
scp billing.revlinemotorworks.com.conf user@your-server:/tmp/

# On your server
cd /tmp/
sudo mv billing.revlinemotorworks.com.conf /etc/httpd/conf.d/
```

### 4. Enable Required Apache Modules

```bash
# Enable mod_rewrite (required for React Router)
sudo sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /etc/httpd/conf.modules.d/00-base.conf

# Enable mod_headers (for caching)
sudo sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /etc/httpd/conf.modules.d/00-base.conf
```

### 5. Test and Restart Apache

```bash
# Test configuration
sudo httpd -t

# If test passes, restart Apache
sudo systemctl restart httpd

# Enable Apache to start on boot
sudo systemctl enable httpd

# Check status
sudo systemctl status httpd
```

### 6. Configure Firewall (if needed)

```bash
# Allow HTTP traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### 7. Verify Deployment

Visit: http://billing.revlinemotorworks.com

Check that:
- ✓ Homepage loads correctly
- ✓ Client-side routing works (no 404 on page refresh)
- ✓ API calls reach billingapi.revlinemotorworks.com

## Troubleshooting

### If you get 403 Forbidden:
```bash
sudo chown -R apache:apache /opt/revline/fe/static
sudo chmod -R 755 /opt/revline/fe/static
sudo setsebool -P httpd_read_user_content 1
```

### If routing doesn't work (404 on refresh):
```bash
# Verify mod_rewrite is loaded
sudo httpd -M | grep rewrite
```

### Check Apache logs:
```bash
sudo tail -f /var/log/httpd/billing.revlinemotorworks.com-error.log
sudo tail -f /var/log/httpd/billing.revlinemotorworks.com-access.log
```

## Future Deployments

For subsequent deployments, you only need:

```bash
# Build locally
npm run build

# Deploy to server
rsync -avz --delete dist/ user@your-server:/opt/revline/fe/static/

# No need to restart Apache for static files
```

## Cloudflare Settings

Make sure your Cloudflare DNS has:
- **Type**: A Record
- **Name**: billing
- **Content**: Your server IP
- **Proxy Status**: Proxied (orange cloud)
- **SSL/TLS Mode**: Flexible or Full (recommended)
