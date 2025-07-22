#!/usr/bin/env python3
"""
Installation and Setup Script for Device Monitoring Agent
=========================================================
This script helps set up the standalone device monitoring agent
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def print_banner():
    """Print installation banner"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║            🔧 Device Monitoring Agent Installer              ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    
    if sys.version_info < (3.7):
        print("❌ Python 3.7 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing dependencies...")
    
    try:
        # Upgrade pip first
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                      check=True, capture_output=True)
        print("✅ pip upgraded successfully")
        
        # Install from requirements.txt
        if Path('requirements.txt').exists():
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                          check=True, capture_output=True)
            print("✅ Core dependencies installed")
        else:
            # Install individual packages
            packages = [
                'aiohttp>=3.8.0',
                'psutil>=5.8.0',
                'requests>=2.25.0'
            ]
            
            for package in packages:
                subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                              check=True, capture_output=True)
                print(f"✅ Installed {package}")
        
        # Try to install optional SNMP support
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'pysnmp>=4.4.12'], 
                          check=True, capture_output=True)
            print("✅ SNMP support installed")
        except subprocess.CalledProcessError:
            print("⚠️  SNMP support installation failed (optional)")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    print("\n📁 Setting up directories...")
    
    directories = ['logs', 'config', 'data']
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def create_service_scripts():
    """Create service management scripts"""
    print("\n🔧 Creating service scripts...")
    
    # Unix/Linux service script
    if platform.system() != 'Windows':
        service_script = """#!/bin/bash
# Device Monitoring Agent Service Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PIDFILE="$SCRIPT_DIR/agent.pid"
LOGFILE="$SCRIPT_DIR/logs/service.log"

start_agent() {
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "Agent is already running (PID: $(cat $PIDFILE))"
        return 1
    fi
    
    echo "Starting Device Monitoring Agent..."
    python3 agent.py >> "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    echo "Agent started with PID $(cat $PIDFILE)"
    echo "Logs: $LOGFILE"
}

stop_agent() {
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Stopping Device Monitoring Agent (PID: $PID)..."
            kill "$PID"
            rm "$PIDFILE"
            echo "Agent stopped"
        else
            echo "Agent is not running (removing stale PID file)"
            rm "$PIDFILE"
        fi
    else
        echo "Agent is not running"
    fi
}

status_agent() {
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Agent is running (PID: $PID)"
            echo "Logs: $LOGFILE"
        else
            echo "Agent is not running (stale PID file)"
            rm "$PIDFILE"
        fi
    else
        echo "Agent is not running"
    fi
}

case "$1" in
    start)
        start_agent
        ;;
    stop)
        stop_agent
        ;;
    restart)
        stop_agent
        sleep 2
        start_agent
        ;;
    status)
        status_agent
        ;;
    logs)
        tail -f "$LOGFILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
"""
        
        with open('service.sh', 'w') as f:
            f.write(service_script)
        
        os.chmod('service.sh', 0o755)
        print("✅ Created service.sh (Unix/Linux)")
    
    # Windows batch script
    windows_script = """@echo off
REM Device Monitoring Agent Service Script for Windows

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set PIDFILE=%SCRIPT_DIR%agent.pid
set LOGFILE=%SCRIPT_DIR%logs\\service.log

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="status" goto status
if "%1"=="logs" goto logs

echo Usage: %0 {start^|stop^|restart^|status^|logs}
exit /b 1

:start
if exist "%PIDFILE%" (
    echo Agent may already be running. Check status first.
)
echo Starting Device Monitoring Agent...
start /b python agent.py >> "%LOGFILE%" 2>&1
echo Agent started. Check logs for details.
goto end

:stop
echo Stopping Device Monitoring Agent...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Device Monitoring Agent*" 2>nul
if exist "%PIDFILE%" del "%PIDFILE%"
echo Agent stopped
goto end

:restart
call %0 stop
timeout /t 2 /nobreak >nul
call %0 start
goto end

:status
tasklist /fi "IMAGENAME eq python.exe" | find "python.exe" >nul
if %errorlevel%==0 (
    echo Agent appears to be running
) else (
    echo Agent is not running
)
goto end

:logs
if exist "%LOGFILE%" (
    type "%LOGFILE%"
) else (
    echo No log file found
)
goto end

:end
"""
    
    with open('service.bat', 'w') as f:
        f.write(windows_script)
    
    print("✅ Created service.bat (Windows)")
    
    return True

def create_systemd_service():
    """Create systemd service file (Linux)"""
    if platform.system() == 'Linux':
        print("\n🐧 Creating systemd service file...")
        
        current_dir = Path.cwd().absolute()
        python_path = sys.executable
        
        service_content = f"""[Unit]
Description=Device Monitoring Agent
After=network.target

[Service]
Type=simple
User={os.getenv('USER', 'root')}
WorkingDirectory={current_dir}
ExecStart={python_path} {current_dir}/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        service_file = Path('device-monitoring-agent.service')
        with open(service_file, 'w') as f:
            f.write(service_content)
        
        print(f"✅ Created {service_file}")
        print("   To install as system service:")
        print(f"   sudo cp {service_file} /etc/systemd/system/")
        print("   sudo systemctl enable device-monitoring-agent")
        print("   sudo systemctl start device-monitoring-agent")
    
    return True

def verify_installation():
    """Verify the installation"""
    print("\n🔍 Verifying installation...")
    
    # Check if main script exists
    if not Path('agent.py').exists():
        print("❌ agent.py not found")
        return False
    
    # Check if config exists
    if not Path('config.ini').exists():
        print("⚠️  config.ini not found - will be created on first run")
    else:
        print("✅ config.ini found")
    
    # Test import of main modules
    try:
        import aiohttp
        print("✅ aiohttp available")
    except ImportError:
        print("❌ aiohttp not available")
        return False
    
    try:
        import psutil
        print("✅ psutil available")
    except ImportError:
        print("⚠️  psutil not available (optional)")
    
    try:
        import pysnmp
        print("✅ pysnmp available (SNMP support enabled)")
    except ImportError:
        print("⚠️  pysnmp not available (SNMP support disabled)")
    
    print("✅ Installation verification completed")
    return True

def print_next_steps():
    """Print next steps for the user"""
    print("\n" + "="*60)
    print("🎉 Installation completed successfully!")
    print("="*60)
    
    print("\n📋 Next Steps:")
    print("1. Edit config.ini to configure your devices and API settings")
    print("2. Test the configuration: python3 agent.py")
    print("3. Start the service: ./service.sh start (Linux/Mac) or service.bat start (Windows)")
    print("4. Check logs: ./service.sh logs or check logs/device_agent.log")
    
    print("\n📖 Configuration Guide:")
    print("• Add your network devices to config.ini")
    print("• Configure IP addresses, SNMP communities, and monitoring methods")
    print("• Set the correct API URL for your monitoring system")
    print("• Adjust poll intervals based on your needs")
    
    print("\n🔧 Service Management:")
    if platform.system() != 'Windows':
        print("• Start: ./service.sh start")
        print("• Stop: ./service.sh stop")
        print("• Status: ./service.sh status")
        print("• Logs: ./service.sh logs")
    else:
        print("• Start: service.bat start")
        print("• Stop: service.bat stop")
        print("• Status: service.bat status")
        print("• Logs: service.bat logs")
    
    print("\n📚 Documentation:")
    print("• Check README.md for detailed configuration options")
    print("• View logs in logs/device_agent.log for troubleshooting")
    print("• Example configurations are provided in config.ini")

def main():
    """Main installation function"""
    print_banner()
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Setup directories
    if not setup_directories():
        return False
    
    # Create service scripts
    if not create_service_scripts():
        return False
    
    # Create systemd service (Linux only)
    create_systemd_service()
    
    # Verify installation
    if not verify_installation():
        return False
    
    # Print next steps
    print_next_steps()
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Installation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Installation failed: {str(e)}")
        sys.exit(1)