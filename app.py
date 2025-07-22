#!/usr/bin/env python3
"""
AI-Based Edge Device Monitoring System - Flask Backend
=====================================================
A comprehensive monitoring system with TR-064 support, predictive analytics,
and real-time device monitoring capabilities.
"""

import os
import json
import sqlite3
import logging
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import threading
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Flask and extensions
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import jwt

# Scientific computing and ML
import numpy as np
import pandas as pd
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings('ignore')

# TR-064 and networking
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse
import socket
import subprocess
import platform
import uuid
from xml.dom import minidom
import base64
import hashlib
import hmac

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config.update({
    'SECRET_KEY': os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production'),
    'JWT_EXPIRATION_HOURS': int(os.getenv('JWT_EXPIRATION_HOURS', '24')),
    'DATABASE_PATH': os.getenv('DATABASE_PATH', 'monitoring.db'),
    'DEBUG': os.getenv('DEBUG', 'false').lower() == 'true',
    'ENABLE_RATE_LIMITING': os.getenv('ENABLE_RATE_LIMITING', 'false').lower() == 'true'
})

# CORS configuration
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    '*'  # Allow all origins for development
])

# Database initialization
def init_database():
    """Initialize the database with all required tables"""
    conn = sqlite3.connect(app.config['DATABASE_PATH'])
    cursor = conn.cursor()
    
    # Devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            location TEXT NOT NULL,
            ip_address TEXT,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            metrics TEXT,
            alerts TEXT,
            predictive_score INTEGER DEFAULT 75,
            maintenance_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Analytics data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices (id)
        )
    ''')
    
    # Bandwidth predictions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bandwidth_predictions (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            device_name TEXT NOT NULL,
            device_type TEXT NOT NULL,
            location TEXT NOT NULL,
            predicted_bandwidth REAL NOT NULL,
            prediction_date DATE NOT NULL,
            confidence_score REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices (id)
        )
    ''')
    
    # Network events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            device_id TEXT,
            message TEXT NOT NULL,
            severity TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # TR-069 devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tr069_devices (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            serial_number TEXT,
            manufacturer TEXT,
            model_name TEXT,
            software_version TEXT,
            mac_address TEXT,
            ip_address TEXT,
            connection_request_url TEXT,
            last_inform DATETIME,
            parameter_list TEXT,
            status TEXT DEFAULT 'online',
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices (id)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_device_metric ON analytics_data (device_id, metric)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_data (timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_network_events_timestamp ON network_events (timestamp)')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# TR-069 (CWMP) Support Classes
@dataclass
class TR069Device:
    """TR-069 CPE device information"""
    device_id: str
    mac_address: str
    serial_number: str
    manufacturer: str
    model_name: str
    software_version: str
    ip_address: str
    connection_request_url: str
    last_inform: str
    parameter_list: dict
    status: str = 'online'

@dataclass
class TR069Session:
    """TR-069 session information"""
    session_id: str
    device_id: str
    sequence_number: int
    authenticated: bool
    last_activity: str
    pending_requests: list

class TR069Server:
    """TR-069 ACS (Auto Configuration Server) implementation"""
    
    def __init__(self, acs_url: str = "http://localhost:5000/api/tr069", username: str = None, password: str = None):
        self.acs_url = acs_url
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.active_sessions = {}
        self.registered_devices = {}
        self.logger = logging.getLogger('TR069Server')
        
    def generate_session_id(self) -> str:
        """Generate unique session ID"""
        return str(uuid.uuid4())
    
    def authenticate_device(self, username: str, password: str) -> bool:
        """Authenticate CPE device"""
        try:
            # Simple authentication - in production, use proper credential management
            if username and password:
                # You can implement more sophisticated authentication here
                return True
            return False
        except Exception as e:
            self.logger.error(f"Authentication error: {str(e)}")
            return False
    
    def create_soap_envelope(self, body_content: str, session_id: str = None) -> str:
        """Create SOAP envelope for TR-069 communication"""
        headers = ""
        if session_id:
            headers = f'<cwmp:ID soap:mustUnderstand="1">{session_id}</cwmp:ID>'
        
        envelope = f'''<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cwmp="urn:dslforum-org:cwmp-1-0">
    <soap:Header>
        {headers}
    </soap:Header>
    <soap:Body>
        {body_content}
    </soap:Body>
</soap:Envelope>'''
        return envelope
    
    def parse_inform_message(self, soap_xml: str) -> Optional[TR069Device]:
        """Parse Inform message from CPE"""
        try:
            root = ET.fromstring(soap_xml)
            
            # Extract device information from Inform message
            device_info = {}
            
            # Find DeviceId structure
            device_id_elem = root.find('.//DeviceId')
            if device_id_elem is not None:
                device_info['manufacturer'] = self._get_element_text(device_id_elem, 'Manufacturer')
                device_info['model_name'] = self._get_element_text(device_id_elem, 'ProductClass')
                device_info['serial_number'] = self._get_element_text(device_id_elem, 'SerialNumber')
            
            # Extract parameter values
            parameter_list = {}
            param_list_elem = root.find('.//ParameterList')
            if param_list_elem is not None:
                for param in param_list_elem.findall('.//ParameterValueStruct'):
                    name = self._get_element_text(param, 'Name')
                    value = self._get_element_text(param, 'Value')
                    if name and value:
                        parameter_list[name] = value
            
            # Create device object
            device = TR069Device(
                device_id=f"tr069_{device_info.get('serial_number', 'unknown')}",
                mac_address=parameter_list.get('Device.Ethernet.Interface.1.MACAddress', ''),
                serial_number=device_info.get('serial_number', ''),
                manufacturer=device_info.get('manufacturer', ''),
                model_name=device_info.get('model_name', ''),
                software_version=parameter_list.get('Device.DeviceInfo.SoftwareVersion', ''),
                ip_address=parameter_list.get('Device.ManagementServer.ConnectionRequestURL', '').split('://')[1].split(':')[0] if '://' in parameter_list.get('Device.ManagementServer.ConnectionRequestURL', '') else '',
                connection_request_url=parameter_list.get('Device.ManagementServer.ConnectionRequestURL', ''),
                last_inform=datetime.now().isoformat(),
                parameter_list=parameter_list
            )
            
            return device
                
        except Exception as e:
            self.logger.error(f"Error parsing Inform message: {str(e)}")
            return None
    
    def create_inform_response(self, session_id: str) -> str:
        """Create InformResponse message"""
        body = '''<cwmp:InformResponse>
            <MaxEnvelopes>1</MaxEnvelopes>
        </cwmp:InformResponse>'''
        return self.create_soap_envelope(body, session_id)
    
    def create_get_parameter_values_request(self, parameter_names: List[str], session_id: str) -> str:
        """Create GetParameterValues request"""
        param_list = ""
        for param in parameter_names:
            param_list += f"<string>{param}</string>"
        
        body = f'''<cwmp:GetParameterValues>
            <ParameterNames soap:arrayType="xsd:string[{len(parameter_names)}]">
                {param_list}
            </ParameterNames>
        </cwmp:GetParameterValues>'''
        return self.create_soap_envelope(body, session_id)
    
    def create_set_parameter_values_request(self, parameters: Dict[str, str], session_id: str) -> str:
        """Create SetParameterValues request"""
        param_list = ""
        for name, value in parameters.items():
            param_list += f'''
            <ParameterValueStruct>
                <Name>{name}</Name>
                <Value xsi:type="xsd:string">{value}</Value>
            </ParameterValueStruct>'''
        
        body = f'''<cwmp:SetParameterValues>
            <ParameterList soap:arrayType="cwmp:ParameterValueStruct[{len(parameters)}]">
                {param_list}
            </ParameterList>
            <ParameterKey></ParameterKey>
        </cwmp:SetParameterValues>'''
        return self.create_soap_envelope(body, session_id)
    
    def create_reboot_request(self, session_id: str) -> str:
        """Create Reboot request"""
        body = '''<cwmp:Reboot>
            <CommandKey>reboot_command</CommandKey>
        </cwmp:Reboot>'''
        return self.create_soap_envelope(body, session_id)
    
    def send_connection_request(self, device: TR069Device) -> bool:
        """Send connection request to CPE"""
        try:
            if not device.connection_request_url:
                return False
            
            # Send HTTP GET to connection request URL
            auth = None
            if self.username and self.password:
                auth = (self.username, self.password)
            
            response = self.session.get(
                device.connection_request_url,
                auth=auth,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            self.logger.error(f"Error sending connection request: {str(e)}")
            return False
    
    def get_device_parameters(self, device_id: str, parameter_names: List[str]) -> Optional[Dict[str, str]]:
        """Get specific parameters from device"""
        try:
            device = self.registered_devices.get(device_id)
            if not device:
                return None
            
            # In a real implementation, you would send GetParameterValues request
            # and wait for response. For now, return cached parameters.
            result = {}
            for param in parameter_names:
                if param in device.parameter_list:
                    result[param] = device.parameter_list[param]
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting device parameters: {str(e)}")
            return None
    
    def set_device_parameters(self, device_id: str, parameters: Dict[str, str]) -> bool:
        """Set parameters on device"""
        try:
            device = self.registered_devices.get(device_id)
            if not device:
                return False
            
            # Send connection request to initiate session
            if self.send_connection_request(device):
                # In a real implementation, you would handle the session
                # and send SetParameterValues request
                self.logger.info(f"Parameter update initiated for device {device_id}")
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error setting device parameters: {str(e)}")
            return False
    
    def reboot_device(self, device_id: str) -> bool:
        """Reboot device via TR-069"""
        try:
            device = self.registered_devices.get(device_id)
            if not device:
                return False
            
            # Send connection request and reboot command
            if self.send_connection_request(device):
                self.logger.info(f"Reboot command sent to device {device_id}")
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error rebooting device: {str(e)}")
            return False
    
    def register_device(self, device: TR069Device):
        """Register device in ACS"""
        self.registered_devices[device.device_id] = device
        self.logger.info(f"Device registered: {device.device_id} ({device.manufacturer} {device.model_name})")
    
    def get_registered_devices(self) -> List[TR069Device]:
        """Get all registered devices"""
        return list(self.registered_devices.values())
    
    def _get_element_text(self, parent, tag_name: str) -> str:
        """Get text content from XML element"""
        element = parent.find(f'.//{tag_name}')
        return element.text if element is not None else ''

# Global TR-069 server instance
tr069_server = TR069Server()

# Add sample TR-069 devices for demonstration
def init_sample_tr069_devices():
    """Initialize sample TR-069 devices"""
    sample_devices = [
        TR069Device(
            device_id="tr069_router_001",
            mac_address="00:1A:2B:3C:4D:5E",
            serial_number="RTR001234567",
            manufacturer="Huawei",
            model_name="HG8245H",
            software_version="V3R017C10S115",
            ip_address="192.168.1.1",
            connection_request_url="http://192.168.1.1:7547/",
            last_inform=datetime.now().isoformat(),
            parameter_list={
                "Device.DeviceInfo.Manufacturer": "Huawei",
                "Device.DeviceInfo.ModelName": "HG8245H",
                "Device.DeviceInfo.SoftwareVersion": "V3R017C10S115",
                "Device.Ethernet.Interface.1.MACAddress": "00:1A:2B:3C:4D:5E",
                "Device.IP.Interface.1.IPv4Address.1.IPAddress": "192.168.1.1",
                "Device.WiFi.Radio.1.Enable": "true",
                "Device.WiFi.SSID.1.SSID": "MyNetwork",
                "Device.ManagementServer.ConnectionRequestURL": "http://192.168.1.1:7547/",
                "Device.DeviceInfo.UpTime": "86400"
            }
        ),
        TR069Device(
            device_id="tr069_ont_002",
            mac_address="00:2B:3C:4D:5E:6F",
            serial_number="ONT002345678",
            manufacturer="ZTE",
            model_name="F660",
            software_version="V8.0.10P7N1",
            ip_address="192.168.1.2",
            connection_request_url="http://192.168.1.2:7547/",
            last_inform=datetime.now().isoformat(),
            parameter_list={
                "Device.DeviceInfo.Manufacturer": "ZTE",
                "Device.DeviceInfo.ModelName": "F660",
                "Device.DeviceInfo.SoftwareVersion": "V8.0.10P7N1",
                "Device.Ethernet.Interface.1.MACAddress": "00:2B:3C:4D:5E:6F",
                "Device.IP.Interface.1.IPv4Address.1.IPAddress": "192.168.1.2",
                "Device.WiFi.Radio.1.Enable": "true",
                "Device.WiFi.SSID.1.SSID": "ZTE_Network",
                "Device.ManagementServer.ConnectionRequestURL": "http://192.168.1.2:7547/",
                "Device.DeviceInfo.UpTime": "172800"
            }
        )
    ]   
# Database helper functions
def get_db():
    """Get database connection"""
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE_PATH'])
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# Authentication helpers
def generate_token(username: str) -> Tuple[str, int]:
    """Generate JWT token"""
    expires_in = app.config['JWT_EXPIRATION_HOURS'] * 3600
    payload = {
        'username': username,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token, expires_in

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['username']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Authentication decorator"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        username = verify_token(token)
        if not username:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        g.current_user = username
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Utility functions
def generate_device_id() -> str:
    """Generate unique device ID"""
    return f"device_{int(time.time())}_{secrets.token_hex(4)}"

def calculate_predictive_score(status: str, metrics: Dict[str, float]) -> int:
    """Calculate device predictive score"""
    base_score = {
        'online': 85,
        'warning': 45,
        'critical': 15,
        'offline': 25
    }.get(status, 50)
    
    if metrics:
        metric_values = list(metrics.values())
        if metric_values:
            avg_metric = sum(metric_values) / len(metric_values)
            if avg_metric > 90:
                base_score = max(10, base_score - 20)
            elif avg_metric < 10:
                base_score = max(10, base_score - 15)
    
    return max(0, min(100, base_score))

# API Routes

@app.route('/api/login', methods=['POST'])
def login():
    """User authentication endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Simple authentication (replace with proper user management)
        if username == 'Admin' and password == 'Admin123':
            token, expires_in = generate_token(username)
            return jsonify({
                'token': token,
                'username': username,
                'expires_in': expires_in
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/devices', methods=['GET'])
@require_auth
def get_devices():
    """Get all devices"""
    try:
        db = get_db()
        cursor = db.execute('''
            SELECT id, name, type, status, location, ip_address, last_seen, 
                   metrics, alerts, predictive_score, maintenance_date, created_at
            FROM devices 
            ORDER BY created_at DESC
        ''')
        
        devices = []
        for row in cursor.fetchall():
            device = {
                'id': row['id'],
                'name': row['name'],
                'type': row['type'],
                'status': row['status'],
                'location': row['location'],
                'ipAddress': row['ip_address'],
                'lastSeen': row['last_seen'],
                'metrics': json.loads(row['metrics']) if row['metrics'] else {},
                'alerts': json.loads(row['alerts']) if row['alerts'] else [],
                'predictiveScore': row['predictive_score'] or 75,
                'maintenanceDate': row['maintenance_date'],
                'timestamp': row['created_at']  # Add timestamp field
            }
            devices.append(device)
        
        return jsonify(devices)
        
    except Exception as e:
        logger.error(f"Error getting devices: {str(e)}")
        return jsonify({'error': 'Failed to get devices'}), 500

@app.route('/api/devices', methods=['POST'])
@require_auth
def create_device():
    """Create a new device"""
    try:
        data = request.get_json()
        
        device_id = generate_device_id()
        name = data.get('name')
        device_type = data.get('type')
        status = data.get('status', 'online')
        location = data.get('location')
        ip_address = data.get('ipAddress')
        metrics = data.get('metrics', {})
        
        # Validate required fields
        if not all([name, device_type, location]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Calculate predictive score
        predictive_score = calculate_predictive_score(status, metrics)
        
        # Set maintenance date (30 days from now)
        maintenance_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        db = get_db()
        db.execute('''
            INSERT INTO devices (id, name, type, status, location, ip_address, metrics, 
                               alerts, predictive_score, maintenance_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (device_id, name, device_type, status, location, ip_address,
              json.dumps(metrics), json.dumps([]), predictive_score, maintenance_date))
        
        db.commit()
        
        return jsonify({
            'id': device_id,
            'message': 'Device created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating device: {str(e)}")
        return jsonify({'error': 'Failed to create device'}), 500

@app.route('/api/devices/<device_id>', methods=['PUT'])
@require_auth
def update_device(device_id):
    """Update device"""
    try:
        data = request.get_json()
        
        db = get_db()
        
        # Check if device exists
        cursor = db.execute('SELECT id FROM devices WHERE id = ?', (device_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Device not found'}), 404
        
        # Update device
        status = data.get('status')
        metrics = data.get('metrics', {})
        
        if status:
            predictive_score = calculate_predictive_score(status, metrics)
            
            db.execute('''
                UPDATE devices 
                SET status = ?, metrics = ?, predictive_score = ?, 
                    last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (status, json.dumps(metrics), predictive_score, device_id))
        
        # Store analytics data
        if metrics:
            for metric, value in metrics.items():
                db.execute('''
                    INSERT INTO analytics_data (device_id, metric, value)
                    VALUES (?, ?, ?)
                ''', (device_id, metric, float(value)))
        
        db.commit()
        
        return jsonify({'message': 'Device updated successfully'})
        
    except Exception as e:
        logger.error(f"Error updating device: {str(e)}")
        return jsonify({'error': 'Failed to update device'}), 500

@app.route('/api/devices/<device_id>', methods=['DELETE'])
@require_auth
def delete_device(device_id):
    """Delete device"""
    try:
        db = get_db()
        
        # Check if device exists
        cursor = db.execute('SELECT id FROM devices WHERE id = ?', (device_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Device not found'}), 404
        
        # Delete device and related data
        db.execute('DELETE FROM analytics_data WHERE device_id = ?', (device_id,))
        db.execute('DELETE FROM bandwidth_predictions WHERE device_id = ?', (device_id,))
        db.execute('DELETE FROM tr069_devices WHERE device_id = ?', (device_id,))
        db.execute('DELETE FROM devices WHERE id = ?', (device_id,))
        
        db.commit()
        
        return jsonify({'message': 'Device deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting device: {str(e)}")
        return jsonify({'error': 'Failed to delete device'}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        db = get_db()
        
        # Get device counts
        cursor = db.execute('SELECT COUNT(*) as total FROM devices')
        total_devices = cursor.fetchone()['total']
        
        cursor = db.execute("SELECT COUNT(*) as online FROM devices WHERE status = 'online'")
        online_devices = cursor.fetchone()['online']
        
        # Get alerts count
        cursor = db.execute('''
            SELECT COUNT(*) as alerts FROM network_events 
            WHERE resolved = FALSE AND severity IN ('warning', 'critical')
        ''')
        total_alerts = cursor.fetchone()['alerts']
        
        # Get average health score
        cursor = db.execute('SELECT AVG(predictive_score) as avg_score FROM devices')
        avg_health_score = cursor.fetchone()['avg_score'] or 0
        
        # Get status distribution
        cursor = db.execute('''
            SELECT status, COUNT(*) as count 
            FROM devices 
            GROUP BY status
        ''')
        status_distribution = {row['status']: row['count'] for row in cursor.fetchall()}
        
        return jsonify({
            'totalDevices': total_devices,
            'onlineDevices': online_devices,
            'totalAlerts': total_alerts,
            'avgHealthScore': round(avg_health_score),
            'statusDistribution': status_distribution
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to get dashboard stats'}), 500

@app.route('/api/analytics/<device_id>/<metric>', methods=['GET'])
@require_auth
def get_analytics_data(device_id, metric):
    """Get analytics data for specific device and metric"""
    try:
        db = get_db()
        
        # Get last 24 hours of data
        cursor = db.execute('''
            SELECT value, timestamp 
            FROM analytics_data 
            WHERE device_id = ? AND metric = ? 
            AND timestamp >= datetime('now', '-24 hours')
            ORDER BY timestamp ASC
        ''', (device_id, metric))
        
        data = []
        for row in cursor.fetchall():
            data.append({
                'value': row['value'],
                'timestamp': row['timestamp']
            })
        
        # If no data, generate some sample data
        if not data:
            now = datetime.now()
            for i in range(24):
                timestamp = now - timedelta(hours=23-i)
                value = 50 + np.sin(i * 0.2) * 20 + np.random.normal(0, 5)
                data.append({
                    'value': max(0, min(100, value)),
                    'timestamp': timestamp.isoformat()
                })
        
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error getting analytics data: {str(e)}")
        return jsonify({'error': 'Failed to get analytics data'}), 500

@app.route('/api/predictive-maintenance', methods=['GET'])
@require_auth
def get_predictive_maintenance():
    """Get predictive maintenance insights"""
    try:
        db = get_db()
        
        cursor = db.execute('''
            SELECT id, name, type, location, metrics, predictive_score, maintenance_date
            FROM devices
        ''')
        
        insights = []
        for row in cursor.fetchall():
            metrics = json.loads(row['metrics']) if row['metrics'] else {}
            score = row['predictive_score'] or 75
            
            risk_level = 'high' if score < 30 else 'medium' if score < 60 else 'low'
            
            recommended_action = {
                'high': 'Immediate maintenance required',
                'medium': 'Schedule maintenance soon',
                'low': 'Continue monitoring'
            }[risk_level]
            
            estimated_cost = 150000 + (100 - score) * 5000
            
            insights.append({
                'deviceId': row['id'],
                'deviceName': row['name'],
                'deviceType': row['type'],
                'location': row['location'],
                'metrics': metrics,
                'predictiveScore': score,
                'maintenanceDate': row['maintenance_date'],
                'riskLevel': risk_level,
                'recommendedAction': recommended_action,
                'estimatedCost': round(estimated_cost)
            })
        
        return jsonify(insights)
        
    except Exception as e:
        logger.error(f"Error getting predictive maintenance: {str(e)}")
        return jsonify({'error': 'Failed to get predictive maintenance'}), 500

@app.route('/api/bandwidth-predictions', methods=['GET'])
@require_auth
def get_bandwidth_predictions():
    """Get bandwidth predictions"""
    try:
        db = get_db()
        
        cursor = db.execute('''
            SELECT id, device_id, device_name, device_type, location,
                   predicted_bandwidth, prediction_date, confidence_score, created_at
            FROM bandwidth_predictions
            ORDER BY prediction_date ASC
        ''')
        
        predictions = []
        for row in cursor.fetchall():
            predictions.append({
                'id': row['id'],
                'deviceId': row['device_id'],
                'deviceName': row['device_name'],
                'deviceType': row['device_type'],
                'location': row['location'],
                'predictedBandwidth': row['predicted_bandwidth'],
                'predictionDate': row['prediction_date'],
                'confidenceScore': row['confidence_score'],
                'createdAt': row['created_at']
            })
        
        return jsonify(predictions)
        
    except Exception as e:
        logger.error(f"Error getting bandwidth predictions: {str(e)}")
        return jsonify({'error': 'Failed to get bandwidth predictions'}), 500

@app.route('/api/generate-bandwidth-predictions', methods=['POST'])
@require_auth
def generate_bandwidth_predictions():
    """Generate AI bandwidth predictions"""
    try:
        db = get_db()
        
        # Get devices with bandwidth metrics
        cursor = db.execute('''
            SELECT d.id, d.name, d.type, d.location,
                   AVG(a.value) as avg_bandwidth
            FROM devices d
            LEFT JOIN analytics_data a ON d.id = a.device_id 
            WHERE a.metric IN ('interface_bandwidth', 'bandwidth_usage', 'throughput')
            GROUP BY d.id, d.name, d.type, d.location
        ''')
        
        devices = cursor.fetchall()
        
        # Clear existing predictions
        db.execute('DELETE FROM bandwidth_predictions')
        
        predictions_created = 0
        
        for device in devices:
            # Get historical data for this device
            cursor = db.execute('''
                SELECT value, timestamp 
                FROM analytics_data 
                WHERE device_id = ? AND metric IN ('interface_bandwidth', 'bandwidth_usage', 'throughput')
                AND timestamp >= datetime('now', '-30 days')
                ORDER BY timestamp ASC
            ''', (device['id'],))
            
            historical_data = cursor.fetchall()
            
            if len(historical_data) >= 7:  # Need at least 7 data points
                # Prepare data for ML
                X = np.array(range(len(historical_data))).reshape(-1, 1)
                y = np.array([row['value'] for row in historical_data])
                
                # Create polynomial features
                poly_features = PolynomialFeatures(degree=2)
                X_poly = poly_features.fit_transform(X)
                
                # Train model
                model = LinearRegression()
                model.fit(X_poly, y)
                
                # Calculate confidence score
                y_pred = model.predict(X_poly)
                mse = mean_squared_error(y, y_pred)
                confidence = max(0.1, min(1.0, 1 / (1 + mse / 100)))
                
                # Generate predictions for next 7 days
                for days_ahead in range(1, 8):
                    future_x = np.array([[len(historical_data) + days_ahead]])
                    future_x_poly = poly_features.transform(future_x)
                    predicted_bandwidth = model.predict(future_x_poly)[0]
                    
                    # Ensure reasonable bounds
                    predicted_bandwidth = max(0, min(100, predicted_bandwidth))
                    
                    prediction_date = (datetime.now() + timedelta(days=days_ahead)).date()
                    prediction_id = f"pred_{device['id']}_{prediction_date}"
                    
                    db.execute('''
                        INSERT INTO bandwidth_predictions 
                        (id, device_id, device_name, device_type, location,
                         predicted_bandwidth, prediction_date, confidence_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (prediction_id, device['id'], device['name'], device['type'],
                          device['location'], predicted_bandwidth, prediction_date, confidence))
                    
                    predictions_created += 1
            else:
                # Generate simple predictions based on current average
                avg_bandwidth = device['avg_bandwidth'] or 50
                
                for days_ahead in range(1, 8):
                    # Add some variation
                    variation = np.random.normal(0, 10)
                    predicted_bandwidth = max(0, min(100, avg_bandwidth + variation))
                    
                    prediction_date = (datetime.now() + timedelta(days=days_ahead)).date()
                    prediction_id = f"pred_{device['id']}_{prediction_date}"
                    
                    db.execute('''
                        INSERT INTO bandwidth_predictions 
                        (id, device_id, device_name, device_type, location,
                         predicted_bandwidth, prediction_date, confidence_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (prediction_id, device['id'], device['name'], device['type'],
                          device['location'], predicted_bandwidth, prediction_date, 0.6))
                    
                    predictions_created += 1
        
        db.commit()
        
        return jsonify({
            'message': f'Generated {predictions_created} bandwidth predictions',
            'predictions_created': predictions_created
        })
        
    except Exception as e:
        logger.error(f"Error generating bandwidth predictions: {str(e)}")
        return jsonify({'error': 'Failed to generate predictions'}), 500

@app.route('/api/network-overview', methods=['GET'])
@require_auth
def get_network_overview():
    """Get network overview statistics"""
    try:
        db = get_db()
        
        # Calculate total traffic (sum of all device bandwidth)
        cursor = db.execute('''
            SELECT AVG(a.value) as avg_traffic
            FROM analytics_data a
            WHERE a.metric IN ('interface_bandwidth', 'bandwidth_usage', 'throughput')
            AND a.timestamp >= datetime('now', '-24 hours')
        ''')
        total_traffic = cursor.fetchone()['avg_traffic'] or 0
        
        # Calculate network uptime
        cursor = db.execute('''
            SELECT AVG(CASE WHEN status = 'online' THEN 100 ELSE 0 END) as uptime
            FROM devices
        ''')
        network_uptime = cursor.fetchone()['uptime'] or 0
        
        # Get critical events
        cursor = db.execute('''
            SELECT COUNT(*) as events
            FROM network_events
            WHERE severity = 'critical' AND resolved = FALSE
        ''')
        critical_events = cursor.fetchone()['events']
        
        # Get top bandwidth consumers
        cursor = db.execute('''
            SELECT d.name, d.type, AVG(a.value) as avg_bandwidth
            FROM devices d
            JOIN analytics_data a ON d.id = a.device_id
            WHERE a.metric IN ('interface_bandwidth', 'bandwidth_usage', 'throughput')
            AND a.timestamp >= datetime('now', '-24 hours')
            GROUP BY d.id, d.name, d.type
            ORDER BY avg_bandwidth DESC
            LIMIT 5
        ''')
        
        top_consumers = []
        for row in cursor.fetchall():
            top_consumers.append({
                'name': row['name'],
                'type': row['type'],
                'avgBandwidth': row['avg_bandwidth']
            })
        
        # Get hourly traffic for the last 24 hours
        hourly_traffic = []
        for hour in range(24):
            # Generate realistic hourly traffic data
            base_traffic = total_traffic
            time_factor = hour / 24.0
            daily_pattern = 0.3 * np.sin(time_factor * 2 * np.pi - np.pi/2) + 0.7
            traffic = base_traffic * daily_pattern + np.random.normal(0, base_traffic * 0.1)
            
            hourly_traffic.append({
                'hour': hour,
                'traffic': max(0, traffic)
            })
        
        return jsonify({
            'totalTraffic': total_traffic,
            'networkUptime': network_uptime,
            'criticalEvents': critical_events,
            'topConsumers': top_consumers,
            'hourlyTraffic': hourly_traffic
        })
        
    except Exception as e:
        logger.error(f"Error getting network overview: {str(e)}")
        return jsonify({'error': 'Failed to get network overview'}), 500

@app.route('/api/ip-tracker', methods=['GET'])
@require_auth
def get_ip_tracker():
    """Get IP device tracker data"""
    try:
        db = get_db()
        
        # Get query parameters
        ip_filter = request.args.get('ip', '')
        name_filter = request.args.get('name', '')
        type_filter = request.args.get('type', '')
        
        # Build query
        query = '''
            SELECT d.id, d.name, d.type, d.status, d.location, d.ip_address,
                   d.last_seen, d.predictive_score, d.metrics,
                   COUNT(a.id) as metric_count,
                   MAX(a.timestamp) as last_metric_time,
                   AVG(CASE WHEN a.metric = 'latency' THEN a.value END) as avg_latency,
                   AVG(CASE WHEN a.metric = 'packet_loss' THEN a.value END) as avg_packet_loss
            FROM devices d
            LEFT JOIN analytics_data a ON d.id = a.device_id
            WHERE 1=1
        '''
        
        params = []
        
        if ip_filter:
            query += ' AND d.ip_address LIKE ?'
            params.append(f'%{ip_filter}%')
        
        if name_filter:
            query += ' AND d.name LIKE ?'
            params.append(f'%{name_filter}%')
        
        if type_filter:
            query += ' AND d.type = ?'
            params.append(type_filter)
        
        query += '''
            GROUP BY d.id, d.name, d.type, d.status, d.location, d.ip_address,
                     d.last_seen, d.predictive_score, d.metrics
            ORDER BY d.last_seen DESC
        '''
        
        cursor = db.execute(query, params)
        
        devices = []
        for row in cursor.fetchall():
            devices.append({
                'id': row['id'],
                'name': row['name'],
                'type': row['type'],
                'status': row['status'],
                'location': row['location'],
                'ipAddress': row['ip_address'] or 'N/A',
                'lastSeen': row['last_seen'],
                'predictiveScore': row['predictive_score'] or 75,
                'metricCount': row['metric_count'],
                'lastMetricTime': row['last_metric_time'],
                'avgLatency': row['avg_latency'] or 0,
                'avgPacketLoss': row['avg_packet_loss'] or 0,
                'metrics': json.loads(row['metrics']) if row['metrics'] else {}
            })
        
        return jsonify(devices)
        
    except Exception as e:
        logger.error(f"Error getting IP tracker data: {str(e)}")
        return jsonify({'error': 'Failed to get IP tracker data'}), 500

@app.route('/api/tr069/inform', methods=['POST'])
@require_auth
def handle_tr069_inform():
    """Handle TR-069 Inform message from CPE"""
    try:
        # Get SOAP XML from request body
        soap_xml = request.data.decode('utf-8')
        
        # Parse Inform message
        device = tr069_server.parse_inform_message(soap_xml)
        
        if device:
            # Register device
            tr069_server.register_device(device)
            
            # Store in database
            db = get_db()
            
            # Create or update device in main devices table
            cursor = db.execute('SELECT id FROM devices WHERE id = ?', (device.device_id,))
            if not cursor.fetchone():
                db.execute('''
                    INSERT INTO devices (id, name, type, status, location, ip_address, metrics, alerts, predictive_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (device.device_id, f"{device.manufacturer} {device.model_name}", 'gateway', 
                      device.status, 'TR-069 Managed', device.ip_address, 
                      json.dumps({}), json.dumps([]), 85))
            
            # Store TR-069 specific data
            db.execute('''
                INSERT OR REPLACE INTO tr069_devices 
                (id, device_id, serial_number, manufacturer, model_name, software_version,
                 mac_address, ip_address, connection_request_url, last_inform, parameter_list, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (f"tr069_{device.serial_number}", device.device_id, device.serial_number,
                  device.manufacturer, device.model_name, device.software_version,
                  device.mac_address, device.ip_address, device.connection_request_url,
                  device.last_inform, json.dumps(device.parameter_list), device.status))
            
            db.commit()
            
            # Generate session ID and create response
            session_id = tr069_server.generate_session_id()
            response_xml = tr069_server.create_inform_response(session_id)
            
            return response_xml, 200, {'Content-Type': 'text/xml'}
        else:
            return jsonify({'error': 'Invalid Inform message'}), 400
            
    except Exception as e:
        logger.error(f"Error handling TR-069 Inform: {str(e)}")
        return jsonify({'error': f'TR-069 Inform handling failed: {str(e)}'}), 500

@app.route('/api/tr069/devices', methods=['GET'])
@require_auth
def get_tr069_devices():
    """Get all TR-069 managed devices"""
    try:
        db = get_db()
        
        cursor = db.execute('''
            SELECT t.*, d.name, d.status as device_status, d.location
            FROM tr069_devices t
            JOIN devices d ON t.device_id = d.id
            ORDER BY t.last_inform DESC
        ''')
        
        devices = []
        for row in cursor.fetchall():
            device = {
                'id': row['id'],
                'deviceId': row['device_id'],
                'serialNumber': row['serial_number'],
                'manufacturer': row['manufacturer'],
                'modelName': row['model_name'],
                'softwareVersion': row['software_version'],
                'macAddress': row['mac_address'],
                'ipAddress': row['ip_address'],
                'connectionRequestUrl': row['connection_request_url'],
                'lastInform': row['last_inform'],
                'parameterList': json.loads(row['parameter_list']) if row['parameter_list'] else {},
                'status': row['status'],
                'deviceName': row['name'],
                'deviceStatus': row['device_status'],
                'location': row['location']
            }
            devices.append(device)
        
        return jsonify(devices)
        
    except Exception as e:
        logger.error(f"Error getting TR-069 devices: {str(e)}")
        return jsonify({'error': 'Failed to get TR-069 devices'}), 500

@app.route('/api/tr069/devices/<device_id>/parameters', methods=['GET'])
@require_auth
def get_device_parameters(device_id):
    """Get device parameters"""
    try:
        parameter_names = request.args.getlist('parameters')
        if not parameter_names:
            # Default parameters to retrieve
            parameter_names = [
                'Device.DeviceInfo.Manufacturer',
                'Device.DeviceInfo.ModelName',
                'Device.DeviceInfo.SoftwareVersion',
                'Device.DeviceInfo.UpTime',
                'Device.WiFi.Radio.1.Enable',
                'Device.WiFi.SSID.1.SSID'
            ]
        
        parameters = tr069_server.get_device_parameters(device_id, parameter_names)
        
        if parameters is not None:
            return jsonify(parameters)
        else:
            return jsonify({'error': 'Device not found or parameters unavailable'}), 404
            
    except Exception as e:
        logger.error(f"Error getting device parameters: {str(e)}")
        return jsonify({'error': 'Failed to get device parameters'}), 500

@app.route('/api/tr069/devices/<device_id>/parameters', methods=['POST'])
@require_auth
def set_device_parameters(device_id):
    """Set device parameters"""
    try:
        data = request.get_json()
        parameters = data.get('parameters', {})
        
        if not parameters:
            return jsonify({'error': 'No parameters provided'}), 400
        
        success = tr069_server.set_device_parameters(device_id, parameters)
        
        if success:
            return jsonify({'message': 'Parameter update initiated successfully'})
        else:
            return jsonify({'error': 'Failed to initiate parameter update'}), 500
            
    except Exception as e:
        logger.error(f"Error setting device parameters: {str(e)}")
        return jsonify({'error': 'Failed to set device parameters'}), 500

@app.route('/api/tr069/devices/<device_id>/reboot', methods=['POST'])
@require_auth
def reboot_device(device_id):
    """Reboot device via TR-069"""
    try:
        success = tr069_server.reboot_device(device_id)
        
        if success:
            return jsonify({'message': 'Reboot command sent successfully'})
        else:
            return jsonify({'error': 'Failed to send reboot command'}), 500
            
    except Exception as e:
        logger.error(f"Error rebooting device: {str(e)}")
        return jsonify({'error': 'Failed to reboot device'}), 500

@app.route('/api/tr069/connection-request/<device_id>', methods=['POST'])
@require_auth
def send_connection_request(device_id):
    """Send connection request to device"""
    try:
        db = get_db()
        
        cursor = db.execute('SELECT * FROM tr069_devices WHERE device_id = ?', (device_id,))
        device_row = cursor.fetchone()
        
        if not device_row:
            return jsonify({'error': 'Device not found'}), 404
        
        # Create device object
        device = TR069Device(
            device_id=device_row['device_id'],
            mac_address=device_row['mac_address'] or '',
            serial_number=device_row['serial_number'] or '',
            manufacturer=device_row['manufacturer'] or '',
            model_name=device_row['model_name'] or '',
            software_version=device_row['software_version'] or '',
            ip_address=device_row['ip_address'] or '',
            connection_request_url=device_row['connection_request_url'] or '',
            last_inform=device_row['last_inform'] or '',
            parameter_list=json.loads(device_row['parameter_list']) if device_row['parameter_list'] else {}
        )
        
        success = tr069_server.send_connection_request(device)
        
        if success:
            return jsonify({'message': 'Connection request sent successfully'})
        else:
            return jsonify({'error': 'Failed to send connection request'}), 500
            
    except Exception as e:
        logger.error(f"Error sending connection request: {str(e)}")
        return jsonify({'error': 'Failed to send connection request'}), 500

@app.route('/api/tr069/simulate-inform', methods=['POST'])
@require_auth
def simulate_inform():
    """Simulate TR-069 Inform message for testing"""
    try:
        data = request.get_json()
        
        # Create sample device
        device = TR069Device(
            device_id=f"tr069_{data.get('serial_number', 'SIM001')}",
            mac_address=data.get('mac_address', '00:11:22:33:44:55'),
            serial_number=data.get('serial_number', 'SIM001'),
            manufacturer=data.get('manufacturer', 'Simulated'),
            model_name=data.get('model_name', 'TestDevice'),
            software_version=data.get('software_version', '1.0.0'),
            ip_address=data.get('ip_address', '192.168.1.100'),
            connection_request_url=data.get('connection_request_url', 'http://192.168.1.100:7547/'),
            last_inform=datetime.now().isoformat(),
            parameter_list=data.get('parameters', {
                'Device.DeviceInfo.Manufacturer': data.get('manufacturer', 'Simulated'),
                'Device.DeviceInfo.ModelName': data.get('model_name', 'TestDevice'),
                'Device.DeviceInfo.SoftwareVersion': data.get('software_version', '1.0.0'),
                'Device.DeviceInfo.UpTime': '3600'
            })
        )
        
        # Register device
        tr069_server.register_device(device)
        
        # Store in database
        db = get_db()
        
        # Create or update device in main devices table
        cursor = db.execute('SELECT id FROM devices WHERE id = ?', (device.device_id,))
        if not cursor.fetchone():
            db.execute('''
                INSERT INTO devices (id, name, type, status, location, ip_address, metrics, alerts, predictive_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (device.device_id, f"{device.manufacturer} {device.model_name}", 'gateway', 
                  'online', 'TR-069 Simulated', device.ip_address, 
                  json.dumps({}), json.dumps([]), 85))
        
        # Store TR-069 specific data
        db.execute('''
            INSERT OR REPLACE INTO tr069_devices 
            (id, device_id, serial_number, manufacturer, model_name, software_version,
             mac_address, ip_address, connection_request_url, last_inform, parameter_list, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (f"tr069_{device.serial_number}", device.device_id, device.serial_number,
              device.manufacturer, device.model_name, device.software_version,
              device.mac_address, device.ip_address, device.connection_request_url,
              device.last_inform, json.dumps(device.parameter_list), 'online'))
        
        db.commit()
        
        return jsonify({
            'message': 'Simulated device registered successfully',
            'device_id': device.device_id,
            'device_info': {
                'manufacturer': device.manufacturer,
                'model_name': device.model_name,
                'serial_number': device.serial_number,
                'ip_address': device.ip_address
            }
        })
        
    except Exception as e:
        logger.error(f"Error simulating TR-069 Inform: {str(e)}")
        return jsonify({'error': f'Simulation failed: {str(e)}'}), 500

@app.route('/api/tr069/devices/<device_id>', methods=['GET'])
@require_auth
def get_tr069_device_details(device_id):
    """Get TR-069 specific device details"""
    try:
        db = get_db()
        
        cursor = db.execute('''
            SELECT t.*, d.name, d.type, d.status, d.location
            FROM tr069_devices t
            JOIN devices d ON t.device_id = d.id
            WHERE t.device_id = ?
        ''', (device_id,))
        
        device = cursor.fetchone()
        if not device:
            return jsonify({'error': 'TR-069 device not found'}), 404
        
        return jsonify({
            'id': device['id'],
            'deviceId': device['device_id'],
            'serialNumber': device['serial_number'],
            'manufacturer': device['manufacturer'],
            'modelName': device['model_name'],
            'softwareVersion': device['software_version'],
            'macAddress': device['mac_address'],
            'ipAddress': device['ip_address'],
            'connectionRequestUrl': device['connection_request_url'],
            'lastInform': device['last_inform'],
            'parameterList': json.loads(device['parameter_list']) if device['parameter_list'] else {},
            'status': device['status'],
            'lastSeen': device['last_seen'],
            'deviceName': device['name'],
            'deviceType': device['type'],
            'deviceStatus': device['status'],
            'location': device['location']
        })
        
    except Exception as e:
        logger.error(f"Error getting TR-069 device details: {str(e)}")
        return jsonify({'error': 'Failed to get device details'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({'error': 'Rate limit exceeded'}), 429

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

# Initialize database on startup
with app.app_context():
    init_database()
    init_sample_tr069_devices()

if __name__ == '__main__':
    logger.info("🚀 Starting AI-Based Edge Device Monitoring System")
    logger.info(f"Debug mode: {app.config['DEBUG']}")
    logger.info(f"Rate limiting: {app.config['ENABLE_RATE_LIMITING']}")
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=app.config['DEBUG'],
        threaded=True
    )