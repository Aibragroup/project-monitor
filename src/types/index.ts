export interface Device {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'wireless_ap' | 'load_balancer' | 'gateway' | 
        'proxy_server' | 'modem' | 'ids_ips' | 'voip_gateway' | 'repeater' | 'bridge' | 
        'nas' | 'vpn_concentrator';
  status: 'online' | 'offline' | 'warning' | 'critical';
  location: string;
  ipAddress?: string;
  lastSeen: Date;
  metrics: Record<string, number>;
  alerts: Alert[];
  predictiveScore: number;
  maintenanceDate: Date;
  timestamp: Date;
  createdAt?: Date;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface AnalyticsData {
  timestamp: Date;
  value: number;
  deviceId: string;
  metric: string;
}

export interface DeviceType {
  name: string;
  metrics: string[];
}

export interface MaintenanceInsight {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  location: string;
  metrics: Record<string, number>;
  predictiveScore: number;
  maintenanceDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
  estimatedCost: number;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalAlerts: number;
  avgHealthScore: number;
  statusDistribution: Record<string, number>;
}
export interface BandwidthPrediction {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  location: string;
  predictedBandwidth: number;
  predictionDate: string;
  confidenceScore: number;
  createdAt: string;
}

export interface NetworkOverview {
  totalTraffic: number;
  networkUptime: number;
  criticalEvents: number;
  topConsumers: Array<{
    name: string;
    type: string;
    avgBandwidth: number;
  }>;
  hourlyTraffic: Array<{
    hour: number;
    traffic: number;
  }>;
}

export interface TrackedDevice {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  ipAddress: string;
  lastSeen: string;
  predictiveScore: number;
  metricCount: number;
  lastMetricTime: string;
  avgLatency: number;
  avgPacketLoss: number;
  metrics: Record<string, number>;
}