import { Device, Alert, AnalyticsData } from '../types';

// This file is now primarily used for analytics data generation
// Real device data comes from the backend

export const generateAnalyticsData = (deviceId: string, metric: string): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    let value = 0;
    
    // Generate realistic values based on metric type
    switch (metric) {
      case 'cpu_usage':
      case 'cpu_load':
        value = 20 + Math.sin(i * 0.1) * 15 + Math.random() * 20;
        break;
      case 'memory_usage':
        value = 40 + Math.cos(i * 0.1) * 10 + Math.random() * 15;
        break;
      case 'interface_bandwidth':
      case 'bandwidth_usage':
        value = 60 + Math.sin(i * 0.2) * 20 + Math.random() * 15;
        break;
      case 'packet_loss':
        value = Math.random() * 2;
        break;
      case 'latency':
        value = 10 + Math.random() * 20;
        break;
      case 'active_sessions':
      case 'active_connections':
        value = 100 + Math.sin(i * 0.3) * 50 + Math.random() * 30;
        break;
      case 'throughput':
        value = 70 + Math.cos(i * 0.2) * 20 + Math.random() * 15;
        break;
      case 'signal_strength':
        value = 80 + Math.sin(i * 0.1) * 10 + Math.random() * 10;
        break;
      case 'disk_usage':
        value = 50 + (i * 0.5) + Math.random() * 5;
        break;
      case 'error_packets':
      case 'error_rates':
        value = Math.random() * 10;
        break;
      default:
        value = 50 + Math.sin(i * 0.2) * 20 + Math.random() * 20;
    }
    
    data.push({
      timestamp,
      value: Math.max(0, Math.min(100, value)),
      deviceId,
      metric
    });
  }
  
  return data;
};