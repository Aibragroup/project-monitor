# Deployment Guide - EdgeMonitor AI

## 🚀 Production Deployment Options

### Option 1: Traditional Server Deployment

#### 1. **Prepare Your Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv nginx -y

# Create application directory
sudo mkdir -p /opt/edgemonitor
sudo chown $USER:$USER /opt/edgemonitor
```

#### 2. **Deploy the Application**
```bash
# Clone/upload your project
cd /opt/edgemonitor
# Upload your project files here

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. **Configure Environment**
```bash
# Create production environment file
cp .env.example .env

# Edit .env for production
nano .env
```

Set these values in `.env`:
```env
FLASK_ENV=production
DEBUG=false
ENABLE_RATE_LIMITING=true
JWT_SECRET_KEY=your-super-secure-secret-key
CORS_ORIGINS=https://your-domain.com
```

#### 4. **Set Up Systemd Service**
```bash
# Create service file
sudo nano /etc/systemd/system/edgemonitor.service
```

```ini
[Unit]
Description=EdgeMonitor AI Flask Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/edgemonitor
Environment=PATH=/opt/edgemonitor/venv/bin
ExecStart=/opt/edgemonitor/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable edgemonitor
sudo systemctl start edgemonitor
sudo systemctl status edgemonitor
```

#### 5. **Configure Nginx Reverse Proxy**
```bash
sudo nano /etc/nginx/sites-available/edgemonitor
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (if serving static files)
    location / {
        root /opt/edgemonitor/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/edgemonitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. **Create Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Run application
CMD ["python", "app.py"]
```

#### 2. **Create docker-compose.yml**
```yaml
version: '3.8'

services:
  edgemonitor-api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - ENABLE_RATE_LIMITING=true
      - DEBUG=false
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
    depends_on:
      - edgemonitor-api
    restart: unless-stopped
```

#### 3. **Deploy with Docker**
```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 3: Cloud Platform Deployment

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set ENABLE_RATE_LIMITING=true
heroku config:set DEBUG=false

# Deploy
git push heroku main
```

## 🔧 **Environment Configuration**

### Local Development
```env
FLASK_ENV=development
DEBUG=true
ENABLE_RATE_LIMITING=false
```

### Production
```env
FLASK_ENV=production
DEBUG=false
ENABLE_RATE_LIMITING=true
JWT_SECRET_KEY=your-super-secure-secret-key
CORS_ORIGINS=https://your-domain.com
```

## 🛡️ **Security Considerations**

### Production Checklist
- ✅ Set `DEBUG=false`
- ✅ Enable rate limiting (`ENABLE_RATE_LIMITING=true`)
- ✅ Use strong JWT secret key
- ✅ Configure proper CORS origins
- ✅ Use HTTPS in production
- ✅ Set up firewall rules
- ✅ Regular security updates
- ✅ Monitor logs and access

### Database Security
- ✅ Regular backups
- ✅ Proper file permissions
- ✅ Consider PostgreSQL for production
- ✅ Database encryption at rest

## 📊 **Monitoring and Maintenance**

### Log Monitoring
```bash
# Check application logs
sudo journalctl -u edgemonitor -f

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks
```bash
# Check service status
sudo systemctl status edgemonitor

# Test API endpoint
curl -X GET http://localhost:5000/api/devices
```

### Backup Strategy
```bash
# Backup database
cp edge_monitoring.db backup_$(date +%Y%m%d_%H%M%S).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/backups/edgemonitor"
mkdir -p $BACKUP_DIR
cp /opt/edgemonitor/edge_monitoring.db $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).db
find $BACKUP_DIR -name "backup_*.db" -mtime +7 -delete
```

## 🚀 **Performance Optimization**

### Production Optimizations
- Use Gunicorn or uWSGI for WSGI server
- Configure connection pooling
- Set up Redis for caching
- Use CDN for static assets
- Enable gzip compression
- Optimize database queries

### Example Gunicorn Configuration
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

This deployment guide ensures your EdgeMonitor AI system runs securely and efficiently in production! 🎯