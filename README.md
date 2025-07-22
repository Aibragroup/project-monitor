# AI-Based Edge Device Monitoring System

A comprehensive Flask-based monitoring system for edge devices with **real-time monitoring**, analytics, and predictive maintenance capabilities.

## Features

- **Real Device Monitoring**: Monitor actual network devices via SNMP, HTTP APIs, and ping
- **Real-time Analytics**: Track device status, metrics, and health scores in real-time
- **Predictive Maintenance**: AI-powered insights for proactive maintenance scheduling
- **Interactive Dashboard**: Real-time charts and data visualization
- **Automated Alerts**: Automatic notifications when devices go offline or have issues
- **Device Management**: Add, edit, and delete devices
- **Multi-Protocol Support**: SNMP, HTTP API, and ping monitoring
- **Secure Authentication**: JWT-based admin authentication
- **Rate Limiting**: Protection against API abuse

## Installation

### Environment Setup

1. **Copy environment configuration**:
   ```bash
   cp .env.example .env
   ```

2. **Configure for your environment**:
   - **Development**: Rate limiting disabled by default
   - **Production**: Enable rate limiting and security features

### 1. Flask API Setup

```bash
# Install Flask dependencies
pip install -r requirements.txt

# Start the Flask API
python app.py
```

### 2. Device Monitoring Agent Setup

```bash
# Install agent dependencies
python install_agent.py

# Or manually install:
pip install -r requirements_agent.txt
```

### 3. Configure Real Devices

Edit `device_config.ini` to add your network devices:

```ini
[device_router_01]
name = Main Router
type = router
ip_address = 192.168.1.1
location = Server Room A
monitoring_methods = ping,snmp
snmp_community = public
poll_interval = 30
enabled = true
```

### 4. Start Monitoring

```bash
# Start the monitoring agent
python device_agent.py

# Or use the service script
./agent_service.sh start
```

### 5. Access Dashboard

Open your browser and navigate to `http://localhost:5173`
- **Username**: Admin
- **Password**: Admin123

## Real Device Monitoring

### Supported Monitoring Methods

1. **PING Monitoring**
   - Basic connectivity checks
   - Response time measurement
   - Packet loss detection

2. **SNMP Monitoring**
   - CPU and memory usage
   - Interface statistics
   - System uptime
   - Device-specific metrics

3. **HTTP API Monitoring**
   - Custom API endpoints
   - JSON response parsing
   - Authentication support

### Supported Device Types

- **Routers**: CPU usage, interface bandwidth, routing table changes, packet loss, latency
- **Switches**: Port status, traffic per port, broadcast storms, MAC table size, error packets
- **Firewalls**: Active sessions, blocked traffic, VPN tunnels, CPU/memory usage, threat detection
- **Wireless APs**: Connected clients, signal strength, channel utilization, packet retransmissions
- **Load Balancers**: Active connections, server response time, throughput, health checks
- **And more**: Gateway, Proxy Server, Modem, IDS/IPS, VoIP Gateway, etc.

## Configuration Guide

### Device Configuration

Each device in `device_config.ini` supports:

```ini
[device_example]
name = Device Name                    # Display name
type = router                        # Device type (affects metrics)
ip_address = 192.168.1.1            # IP address to monitor
location = Server Room               # Physical location
monitoring_methods = ping,snmp,http  # Monitoring methods (comma-separated)
snmp_community = public              # SNMP community string
snmp_port = 161                      # SNMP port
http_endpoint = http://ip/api/status # Custom HTTP endpoint
poll_interval = 30                   # Polling interval in seconds
enabled = true                       # Enable/disable monitoring
```

### API Configuration

```ini
[api]
url = http://localhost:5000/api      # Flask API URL
username = Admin                     # API username
password = Admin123                  # API password
```

## Automatic Notifications

The system automatically:

1. **Detects Device Status Changes**
   - Online → Offline
   - Normal → Warning/Critical
   - Status recovery notifications

2. **Generates Smart Alerts**
   - Critical: CPU > 90%, Memory > 90%, Device offline
   - Warning: CPU > 70%, High error rates, Slow response
   - Info: Status recovery, Maintenance reminders

3. **Real-time Dashboard Updates**
   - Live status indicators
   - Real-time metrics charts
   - Alert notifications

## API Endpoints

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Add new device
- `PUT /api/devices/<id>` - Update device
- `DELETE /api/devices/<id>` - Delete device

### Authentication
- `POST /api/login` - Admin login (returns JWT token)

### Analytics
- `GET /api/analytics/<device_id>/<metric>` - Get analytics data for specific device and metric
- `GET /api/dashboard-stats` - Get dashboard statistics

### Maintenance
- `GET /api/predictive-maintenance` - Get predictive maintenance insights

## Agent Service Management

Use the service script to manage the monitoring agent:

```bash
# Start the agent
./agent_service.sh start

# Stop the agent
./agent_service.sh stop

# Restart the agent
./agent_service.sh restart

# Check agent status
./agent_service.sh status
```

## Monitoring Logs

Check the following log files:

- `device_agent.log` - Agent monitoring logs
- `flask.log` - API server logs (if configured)

## Troubleshooting

### Common Issues

1. **SNMP Not Working**
   ```bash
   # Install SNMP dependencies
   pip install pysnmp
   
   # Check SNMP community and port
   snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.1.1.0
   ```

2. **Device Not Responding**
   - Verify IP address and network connectivity
   - Check firewall rules
   - Ensure SNMP is enabled on the device

3. **Authentication Issues**
   - Verify API credentials in device_config.ini
   - Check Flask API is running on correct port
   - Ensure JWT token is not expired

4. **High CPU Usage**
   - Increase poll intervals in device_config.ini
   - Reduce number of monitored devices
   - Optimize monitoring methods

## Security Features

- **JWT Authentication**: Secure admin access
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Prevents malicious data injection
- **SQL Injection Prevention**: Parameterized queries
- **Security Headers**: CSRF, XSS protection
- **Encrypted Passwords**: Bcrypt password hashing

## Performance Optimization

- **Asynchronous Monitoring**: Non-blocking device checks
- **Configurable Intervals**: Adjust polling frequency per device
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Reduced API calls

## Production Deployment

1. **Use Production WSGI Server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Configure Reverse Proxy** (Nginx)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5173;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

3. **Use Production Database**
   - PostgreSQL or MySQL for better performance
   - Configure connection pooling
   - Set up database backups

4. **Enable SSL/TLS**
   - Use Let's Encrypt or commercial certificates
   - Configure HTTPS redirects
   - Update security headers

5. **Set up Process Management**
   - Use systemd services for auto-restart
   - Configure log rotation
   - Set up monitoring alerts

## License

MIT License