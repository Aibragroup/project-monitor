#!/usr/bin/env python3
"""
Generate Sample Analytics Data
=============================
This script generates historical analytics data for your devices
so you can see charts and predictions immediately.
"""

import sqlite3
import random
import json
from datetime import datetime, timedelta
from typing import List, Dict

def get_device_types():
    """Get device type configurations"""
    return {
        'router': {
            'name': 'Router',
            'metrics': ['cpu_usage', 'interface_bandwidth', 'routing_table_changes', 'packet_loss', 'latency']
        },
        'switch': {
            'name': 'Switch', 
            'metrics': ['port_status', 'traffic_per_port', 'broadcast_storms', 'mac_table_size', 'error_packets']
        },
        'firewall': {
            'name': 'Firewall',
            'metrics': ['active_sessions', 'blocked_traffic', 'vpn_tunnels', 'cpu_usage', 'memory_usage', 'threat_detection']
        },
        'wireless_ap': {
            'name': 'Wireless Access Point',
            'metrics': ['connected_clients', 'signal_strength', 'channel_utilization', 'packet_retransmissions', 'bandwidth_usage']
        },
        'load_balancer': {
            'name': 'Load Balancer',
            'metrics': ['active_connections', 'server_response_time', 'throughput', 'failed_health_checks', 'traffic_distribution']
        }
    }

def generate_realistic_value(metric: str, base_value: float, time_factor: float) -> float:
    """Generate realistic metric values with time-based variations"""
    
    # Base values for different metrics
    base_ranges = {
        'cpu_usage': (20, 80),
        'memory_usage': (30, 85),
        'interface_bandwidth': (40, 95),
        'packet_loss': (0, 5),
        'latency': (5, 50),
        'port_status': (85, 100),
        'traffic_per_port': (30, 90),
        'active_sessions': (50, 300),
        'blocked_traffic': (10, 40),
        'connected_clients': (20, 100),
        'signal_strength': (70, 95),
        'throughput': (60, 100),
        'active_connections': (100, 500)
    }
    
    min_val, max_val = base_ranges.get(metric, (20, 80))
    
    # Add time-based variation (daily patterns)
    daily_variation = 0.3 * math.sin(time_factor * 2 * math.pi)
    
    # Add random noise
    noise = random.uniform(-0.2, 0.2)
    
    # Calculate final value
    range_size = max_val - min_val
    value = min_val + (range_size * (0.5 + daily_variation + noise))
    
    return max(0, min(max_val, value))

def create_analytics_data():
    """Create analytics data table and populate with sample data"""
    
    conn = sqlite3.connect('monitoring.db')
    cursor = conn.cursor()
    
    # Create analytics_data table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            timestamp DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Get existing devices
    cursor.execute('SELECT id, type, metrics FROM devices')
    devices = cursor.fetchall()
    
    if not devices:
        print("❌ No devices found. Please add devices first.")
        conn.close()
        return
    
    print(f"📊 Generating analytics data for {len(devices)} devices...")
    
    device_types = get_device_types()
    
    # Generate data for the last 30 days
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)
    
    total_records = 0
    
    for device_id, device_type, metrics_json in devices:
        print(f"   Processing device: {device_id}")
        
        # Parse device metrics
        try:
            device_metrics = json.loads(metrics_json) if metrics_json else {}
        except:
            device_metrics = {}
        
        # Get metrics for this device type
        type_config = device_types.get(device_type, device_types['router'])
        available_metrics = type_config['metrics']
        
        # Generate data points every hour for 30 days
        current_time = start_time
        while current_time <= end_time:
            
            # Time factor for daily patterns (0 to 1 over 24 hours)
            time_factor = (current_time.hour + current_time.minute / 60.0) / 24.0
            
            for metric in available_metrics:
                # Get base value from device or use default
                base_value = device_metrics.get(metric, 50.0)
                
                # Generate realistic value
                value = generate_realistic_value(metric, base_value, time_factor)
                
                # Insert into database
                cursor.execute('''
                    INSERT INTO analytics_data (device_id, metric, value, timestamp)
                    VALUES (?, ?, ?, ?)
                ''', (device_id, metric, value, current_time))
                
                total_records += 1
            
            # Move to next hour
            current_time += timedelta(hours=1)
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"✅ Generated {total_records:,} analytics records")
    print(f"📈 Data spans {(end_time - start_time).days} days")
    print("🎯 You can now view analytics and generate bandwidth predictions!")

def create_network_events():
    """Create sample network events"""
    
    conn = sqlite3.connect('monitoring.db')
    cursor = conn.cursor()
    
    # Create network_events table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            device_id TEXT,
            message TEXT NOT NULL,
            severity TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            resolved BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Get device IDs
    cursor.execute('SELECT id, name FROM devices')
    devices = cursor.fetchall()
    
    if not devices:
        conn.close()
        return
    
    print("📅 Generating network events...")
    
    # Sample events
    event_templates = [
        ("device_offline", "critical", "{device_name} went offline"),
        ("high_cpu", "warning", "{device_name} CPU usage exceeded 80%"),
        ("high_memory", "warning", "{device_name} memory usage exceeded 85%"),
        ("interface_down", "critical", "{device_name} interface went down"),
        ("high_latency", "warning", "{device_name} experiencing high latency"),
        ("device_recovery", "info", "{device_name} came back online"),
        ("maintenance", "info", "Scheduled maintenance on {device_name}"),
        ("firmware_update", "info", "Firmware updated on {device_name}")
    ]
    
    # Generate events for the last 7 days
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    events_created = 0
    
    for _ in range(50):  # Generate 50 random events
        device_id, device_name = random.choice(devices)
        event_type, severity, message_template = random.choice(event_templates)
        
        # Random timestamp in the last 7 days
        random_time = start_time + timedelta(
            seconds=random.randint(0, int((end_time - start_time).total_seconds()))
        )
        
        message = message_template.format(device_name=device_name)
        resolved = random.choice([True, False]) if severity != "info" else True
        
        cursor.execute('''
            INSERT INTO network_events (event_type, device_id, message, severity, timestamp, resolved)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (event_type, device_id, message, severity, random_time, resolved))
        
        events_created += 1
    
    conn.commit()
    conn.close()
    
    print(f"✅ Generated {events_created} network events")

if __name__ == "__main__":
    import math
    
    print("🚀 Generating Sample Data for Analytics and Predictions")
    print("=" * 60)
    
    try:
        # Create analytics data
        create_analytics_data()
        
        # Create network events
        create_network_events()
        
        print("\n🎉 Sample data generation completed!")
        print("\n📋 Next steps:")
        print("1. Restart your Flask application")
        print("2. Go to Analytics tab to see charts")
        print("3. Go to AI Predictor tab and click 'Generate Predictions'")
        print("4. Go to Network Dashboard to see network overview")
        
    except Exception as e:
        print(f"❌ Error generating sample data: {str(e)}")
        import traceback
        traceback.print_exc()