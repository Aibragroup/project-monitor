# Device Monitoring Agent - Standalone Edition

A comprehensive, standalone device monitoring agent that monitors physical network devices and sends real-time metrics to remote monitoring APIs.

## 🚀 Features

- **Multi-Protocol Monitoring**: SNMP, HTTP API, and Ping monitoring
- **Real-Time Metrics**: Continuous monitoring with configurable intervals
- **Device Auto-Discovery**: Automatic device registration with remote APIs
- **Status Change Notifications**: Instant alerts when devices go offline or have issues
- **Comprehensive Logging**: Detailed logs for troubleshooting and monitoring
- **Service Management**: Easy start/stop/restart with service scripts
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Standalone Operation**: Runs independently from the main monitoring system

## 📋 Supported Devices

- **Routers**: CPU usage, interface bandwidth, routing table changes, packet loss, latency
- **Switches**: Port status, traffic per port, broadcast storms, MAC table size, error packets
- **Firewalls**: Active sessions, blocked traffic, VPN tunnels, CPU/memory usage, threat detection
- **Wireless APs**: Connected clients, signal strength, channel utilization, packet retransmissions
- **Load Balancers**: Active connections, server response time, throughput, health checks
- **Gateways**: Traffic forwarding rate, protocol translations, CPU load, dropped packets
- **NAS Devices**: Disk usage, read/write throughput, active connections, temperature
- **And more**: Proxy servers, modems, IDS/IPS, VoIP gateways, repeaters, bridges, VPN concentrators

## 🔧 Installation

### Quick Install

```bash
# Clone or download the agent
cd device-monitoring-agent

# Run the installer
python3 install.py
```

### Manual Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Create directories
mkdir -p logs config data

# Make service script executable (Linux/Mac)
chmod +x service.sh
```

## ⚙️ Configuration

Edit `config.ini` to configure your devices and API settings:

### API Configuration

```ini
[api]
base_url = http://your-monitoring-server:5000/api
username = Admin
password = Admin123
timeout = 30
retry_attempts = 3
retry_delay = 5
```

### Device Configuration

```ini
[device_router_01]
name = Main Router
type = router
ip_address = 192.168.1.1
location = Server Room A
monitoring_methods = ping,snmp
snmp_community = public
snmp_port = 161
snmp_version = 2c
poll_interval = 30
timeout = 10
enabled = true
```

### Monitoring Methods

- **ping**: Basic connectivity and response time monitoring
- **snmp**: Detailed device metrics via SNMP protocol
- **http**: Custom HTTP API endpoint monitoring

### Device Types

Configure the `type` field to match your device:

- `router` - Network routers
- `switch` - Network switches
- `firewall` - Security firewalls
- `wireless_ap` - WiFi access points
- `load_balancer` - Load balancers
- `gateway` - Network gateways
- `proxy_server` - Proxy servers
- `modem` - Network modems
- `ids_ips` - Intrusion detection/prevention systems
- `voip_gateway` - VoIP gateways
- `repeater` - Signal repeaters
- `bridge` - Network bridges
- `nas` - Network attached storage
- `vpn_concentrator` - VPN concentrators

## 🚀 Usage

### Running the Agent

```bash
# Direct execution
python3 agent.py

# Using service script (Linux/Mac)
./service.sh start

# Using service script (Windows)
service.bat start
```

### Service Management

#### Linux/macOS

```bash
# Start the agent
./service.sh start

# Stop the agent
./service.sh stop

# Restart the agent
./service.sh restart

# Check status
./service.sh status

# View logs
./service.sh logs
```

#### Windows

```batch
# Start the agent
service.bat start

# Stop the agent
service.bat stop

# Restart the agent
service.bat restart

# Check status
service.bat status

# View logs
service.bat logs
```

### System Service (Linux)

Install as a systemd service:

```bash
# Copy service file
sudo cp device-monitoring-agent.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable device-monitoring-agent
sudo systemctl start device-monitoring-agent

# Check status
sudo systemctl status device-monitoring-agent
```

## 📊 Monitoring Capabilities

### SNMP Monitoring

The agent uses standard SNMP OIDs to collect:

- System uptime and description
- CPU usage and load
- Memory utilization
- Interface statistics (bandwidth, errors, status)
- Device-specific metrics based on type

### HTTP API Monitoring

For modern devices with REST APIs:

- Custom endpoint monitoring
- JSON response parsing
- Authentication support
- Flexible metric extraction

### Ping Monitoring

Basic connectivity monitoring:

- Response time measurement
- Packet loss detection
- Availability status

## 📈 Metrics Collected

### Router Metrics
- CPU usage percentage
- Interface bandwidth utilization
- Routing table changes
- Packet loss percentage
- Network latency
- System uptime

### Switch Metrics
- Port status (up/down percentage)
- Traffic per port
- Broadcast storm detection
- MAC table size
- Error packet count
- System uptime

### Firewall Metrics
- Active sessions count
- Blocked traffic percentage
- VPN tunnel count
- CPU and memory usage
- Threat detection count
- System uptime

### Universal Metrics
- Device availability (online/offline)
- Response time
- System uptime
- Error rates

## 🔍 Troubleshooting

### Common Issues

1. **SNMP Not Working**
   ```bash
   # Test SNMP connectivity
   snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.1.1.0
   
   # Install SNMP tools (Ubuntu/Debian)
   sudo apt-get install snmp snmp-mibs-downloader
   ```

2. **Device Not Responding**
   - Verify IP address and network connectivity
   - Check firewall rules on both ends
   - Ensure SNMP is enabled on the device
   - Verify SNMP community string

3. **Authentication Issues**
   - Check API credentials in config.ini
   - Verify the monitoring API is accessible
   - Check network connectivity to API server

4. **High Resource Usage**
   - Increase poll intervals in config.ini
   - Reduce number of monitored devices
   - Optimize monitoring methods (use ping instead of SNMP for basic checks)

### Log Files

- `logs/device_agent.log` - Main application logs
- `logs/service.log` - Service management logs (when using service scripts)

### Debug Mode

Enable debug logging by modifying the logging level in `agent.py`:

```python
logging.basicConfig(level=logging.DEBUG, ...)
```

## 🔒 Security Considerations

- Use secure SNMP community strings (not 'public')
- Consider SNMP v3 for encrypted communication
- Restrict network access to monitoring ports
- Use strong API credentials
- Run the agent with minimal required privileges
- Regularly update dependencies

## 🚀 Deployment Scenarios

### Single Server Deployment
Run the agent on a dedicated monitoring server that has network access to all devices.

### Distributed Deployment
Deploy multiple agent instances across different network segments, all reporting to a central monitoring API.

### Cloud Deployment
Run the agent in cloud instances to monitor on-premises devices through VPN connections.

### Container Deployment
Package the agent in a Docker container for easy deployment and scaling.

## 📚 API Integration

The agent is designed to work with any monitoring API that supports:

- JWT authentication
- Device CRUD operations
- Metric updates via REST API

### API Endpoints Used

- `POST /api/login` - Authentication
- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `PUT /api/devices/{id}` - Update device metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

1. Check the logs in `logs/device_agent.log`
2. Review the configuration in `config.ini`
3. Test individual components (ping, SNMP, HTTP)
4. Check network connectivity and firewall rules

## 🔄 Updates

To update the agent:

1. Backup your `config.ini` file
2. Download the latest version
3. Restore your configuration
4. Restart the service

---

**Device Monitoring Agent** - Keeping your network infrastructure monitored 24/7! 🔍📡