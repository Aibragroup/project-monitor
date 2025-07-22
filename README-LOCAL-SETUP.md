# Local Development Setup

## Quick Start

1. **Clone/Download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Start the Flask backend**:
   ```bash
   python app.py
   ```
   The Flask API will run on http://localhost:5000

4. **Start the React frontend** (in a new terminal):
   ```bash
   npm run dev
   ```
   The React app will run on http://localhost:5173

5. **Access the application**:
   Open http://localhost:5173 in your browser
   - Username: Admin
   - Password: Admin123

## Why This Fixes the Network Error

When running locally:
- Flask API runs on localhost:5000
- React app runs on localhost:5173
- Vite proxy configuration routes /api requests to localhost:5000
- Both frontend and backend are on the same machine, so they can communicate

## Setting Up the Device Monitoring Agent

1. **Navigate to the agent folder**:
   ```bash
   cd device-monitoring-agent
   ```

2. **Install agent dependencies**:
   ```bash
   python install.py
   ```

3. **Configure your devices** in `config.ini`:
   ```ini
   [device_router_01]
   name = Your Router
   type = router
   ip_address = 192.168.1.1
   location = Your Location
   monitoring_methods = ping,snmp
   enabled = true
   ```

4. **Start the monitoring agent**:
   ```bash
   python agent.py
   ```

The agent will automatically:
- Monitor your configured devices
- Send metrics to the Flask API
- Create devices in the system if they don't exist
- Update device status in real-time