# Deployment Guide for RevLine Frontend (Nginx)

## Build Completed ✓
Your production build is ready in the `dist/` folder.

## Server Information
- **Server OS**: AlmaLinux
- **Domain**: billing.revlinemotorworks.com
- **Web Server**: Nginx
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
sudo chown -R nginx:nginx /opt/revline/fe/static
sudo chmod -R 755 /opt/revline/fe/static
```

### 3. Install Nginx (if not already installed)

```bash
# Install nginx
sudo dnf install -y nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

### 4. Configure Nginx

Copy the Nginx configuration file to your server:

```bash
# On your local machine
scp billing.revlinemotorworks.com-nginx.conf user@your-server:/tmp/

# On your server
sudo mv /tmp/billing.revlinemotorworks.com-nginx.conf /etc/nginx/conf.d/billing.revlinemotorworks.com.conf
```

### 5. Test and Start Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### 6. Configure SELinux (AlmaLinux specific)

```bash
# Allow nginx to read the static files
sudo chcon -R -t httpd_sys_content_t /opt/revline/fe/static

# Or permanently set the context
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/revline/fe/static(/.*)?"
sudo restorecon -Rv /opt/revline/fe/static

# If you need to allow nginx to make network connections (for proxy_pass, if used later)
sudo setsebool -P httpd_can_network_connect 1
```

### 7. Configure Firewall

```bash
# Allow HTTP traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

### 8. Verify Deployment

Visit: http://billing.revlinemotorworks.com

Check that:
- ✓ Homepage loads correctly
- ✓ Client-side routing works (no 404 on page refresh)
- ✓ API calls reach billingapi.revlinemotorworks.com
- ✓ Static assets are cached properly

## Troubleshooting

### If you get 403 Forbidden:
```bash
# Check permissions
sudo chown -R nginx:nginx /opt/revline/fe/static
sudo chmod -R 755 /opt/revline/fe/static

# Check SELinux context
ls -Z /opt/revline/fe/static

# Fix SELinux if needed
sudo chcon -R -t httpd_sys_content_t /opt/revline/fe/static
```

### If routing doesn't work (404 on refresh):
```bash
# Check nginx configuration
sudo nginx -t

# Verify try_files directive is present in config
sudo cat /etc/nginx/conf.d/billing.revlinemotorworks.com.conf | grep try_files
```

### If site doesn't load at all:
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check firewall
sudo firewall-cmd --list-all

# Check if port 80 is listening
sudo netstat -tulpn | grep :80
# or
sudo ss -tulpn | grep :80
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/billing.revlinemotorworks.com-error.log
sudo tail -f /var/log/nginx/billing.revlinemotorworks.com-access.log
```

### SELinux troubleshooting:
```bash
# Check for SELinux denials
sudo ausearch -m avc -ts recent

# Temporarily disable SELinux (for testing only)
sudo setenforce 0

# Re-enable SELinux
sudo setenforce 1
```

## Future Deployments

For subsequent deployments, you only need:

```bash
# Build locally
npm run build

# Deploy to server
rsync -avz --delete dist/ user@your-server:/opt/revline/fe/static/

# No need to restart Nginx for static files
# Nginx automatically serves the new files
```

## Cloudflare Settings

Make sure your Cloudflare DNS has:
- **Type**: A Record
- **Name**: billing
- **Content**: Your server IP
- **Proxy Status**: Proxied (orange cloud)
- **SSL/TLS Mode**: Flexible or Full (recommended)

## Useful Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration (graceful reload without downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error log
sudo tail -f /var/log/nginx/error.log

# View access log
sudo tail -f /var/log/nginx/access.log
```

## Performance Tips

1. **Enable HTTP/2** (requires SSL):
   - After setting up SSL, change `listen 80` to `listen 443 ssl http2`

2. **Increase worker processes**:
   - Edit `/etc/nginx/nginx.conf`
   - Set `worker_processes auto;`

3. **Optimize buffer sizes** for large files:
   ```nginx
   client_body_buffer_size 10K;
   client_header_buffer_size 1k;
   client_max_body_size 8m;
   large_client_header_buffers 2 1k;
   ```
