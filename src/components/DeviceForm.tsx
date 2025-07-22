import React, { useState, useEffect } from 'react';
import { Device, DeviceType } from '../types';
import { Save, X, Move } from 'lucide-react';

interface DeviceFormProps {
  device: Device | null;
  onSubmit: (device: Device) => void;
  onCancel: () => void;
}

const DEVICE_TYPES: Record<string, DeviceType & { description: string }> = {
  router: {
    name: 'Router',
    description: 'Network routing device',
    metrics: ['cpu_usage', 'interface_bandwidth', 'routing_table_changes', 'packet_loss', 'latency']
  },
  switch: {
    name: 'Switch',
    description: 'Network switching device',
    metrics: ['port_status', 'traffic_per_port', 'broadcast_storms', 'mac_table_size', 'error_packets']
  },
  firewall: {
    name: 'Firewall',
    description: 'Network security device',
    metrics: ['active_sessions', 'blocked_traffic', 'vpn_tunnels', 'cpu_usage', 'memory_usage', 'threat_detection']
  },
  wireless_ap: {
    name: 'Wireless Access Point',
    description: 'Wireless network access point',
    metrics: ['connected_clients', 'signal_strength', 'channel_utilization', 'packet_retransmissions', 'bandwidth_usage']
  },
  load_balancer: {
    name: 'Load Balancer',
    description: 'Traffic load balancing device',
    metrics: ['active_connections', 'server_response_time', 'throughput', 'failed_health_checks', 'traffic_distribution']
  },
  gateway: {
    name: 'Gateway',
    description: 'Network gateway device',
    metrics: ['traffic_forwarding_rate', 'protocol_translations', 'cpu_load', 'dropped_packets', 'latency']
  },
  proxy_server: {
    name: 'Proxy Server',
    description: 'Network proxy server',
    metrics: ['cache_hit_ratio', 'concurrent_connections', 'response_time', 'blocked_requests', 'cpu_usage']
  },
  modem: {
    name: 'Modem',
    description: 'Network modem device',
    metrics: ['line_status', 'snr', 'upstream_rate', 'downstream_rate', 'connection_uptime', 'error_rates']
  },
  ids_ips: {
    name: 'IDS/IPS',
    description: 'Intrusion Detection/Prevention System',
    metrics: ['detected_threats', 'dropped_packets', 'cpu_load', 'false_positives', 'signature_updates']
  },
  voip_gateway: {
    name: 'VoIP Gateway',
    description: 'Voice over IP gateway',
    metrics: ['active_calls', 'call_quality_mos', 'packet_jitter', 'call_success_rate', 'call_failure_rate', 'codec_utilization']
  },
  repeater: {
    name: 'Repeater',
    description: 'Signal repeater device',
    metrics: ['signal_amplification', 'input_error_rate', 'output_error_rate', 'link_uptime']
  },
  bridge: {
    name: 'Bridge',
    description: 'Network bridge device',
    metrics: ['mac_filtering', 'packet_forwarding_rate', 'port_status', 'collision_rates']
  },
  nas: {
    name: 'NAS',
    description: 'Network Attached Storage',
    metrics: ['disk_usage', 'read_throughput', 'write_throughput', 'active_connections', 'disk_temperature', 'error_logs']
  },
  vpn_concentrator: {
    name: 'VPN Concentrator',
    description: 'VPN connection concentrator',
    metrics: ['active_vpn_sessions', 'throughput', 'authentication_failures', 'cpu_usage', 'encryption_performance']
  }
};

export const DeviceForm: React.FC<DeviceFormProps> = ({ device, onSubmit, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState({
    name: device?.name || '',
    type: device?.type || '',
    location: device?.location || '',
    status: device?.status || '',
    metrics: device?.metrics || {}
  });

  const currentTypeConfig = DEVICE_TYPES[formData.type];

  useEffect(() => {
    // Initialize metrics when device type changes
    if (!device && formData.type) {
      const defaultMetrics: Record<string, number> = {};
      currentTypeConfig.metrics.forEach(metric => {
        defaultMetrics[metric] = 0; // Start with 0 instead of defaults
      });
      setFormData(prev => ({ ...prev, metrics: defaultMetrics }));
    }
  }, [formData.type, device, currentTypeConfig?.metrics]);

  const getDefaultValueForMetric = (metric: string): number => {
    const defaults: Record<string, number> = {
      cpu_usage: 25,
      memory_usage: 40,
      interface_bandwidth: 80,
      routing_table_changes: 5,
      packet_loss: 0.1,
      latency: 15,
      port_status: 95,
      traffic_per_port: 60,
      broadcast_storms: 2,
      mac_table_size: 70,
      error_packets: 10,
      active_sessions: 150,
      blocked_traffic: 25,
      vpn_tunnels: 8,
      threat_detection: 12,
      connected_clients: 45,
      signal_strength: 85,
      channel_utilization: 65,
      packet_retransmissions: 3,
      bandwidth_usage: 70,
      active_connections: 200,
      server_response_time: 120,
      throughput: 85,
      failed_health_checks: 2,
      traffic_distribution: 80,
      traffic_forwarding_rate: 90,
      protocol_translations: 50,
      cpu_load: 30,
      dropped_packets: 5,
      cache_hit_ratio: 75,
      concurrent_connections: 180,
      response_time: 95,
      blocked_requests: 15,
      line_status: 98,
      snr: 35,
      upstream_rate: 50,
      downstream_rate: 100,
      connection_uptime: 99,
      error_rates: 0.5,
      detected_threats: 8,
      dropped_packets: 12,
      cpu_load: 35,
      false_positives: 3,
      signature_updates: 95,
      active_calls: 25,
      call_quality_mos: 4.2,
      packet_jitter: 8,
      call_success_rate: 98,
      call_failure_rate: 2,
      codec_utilization: 60,
      signal_amplification: 85,
      input_error_rate: 0.2,
      output_error_rate: 0.3,
      link_uptime: 99.5,
      mac_filtering: 90,
      packet_forwarding_rate: 95,
      collision_rates: 1,
      disk_usage: 65,
      read_throughput: 120,
      write_throughput: 80,
      disk_temperature: 42,
      error_logs: 5,
      active_vpn_sessions: 35,
      authentication_failures: 3,
      encryption_performance: 88
    };
    return defaults[metric] || 50;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData); // Debug log
    
    // Validate required fields
    if (!formData.name || !formData.type || !formData.location || !formData.status) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate metrics - ensure all have values
    const validMetrics: Record<string, number> = {};
    Object.entries(formData.metrics).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        validMetrics[key] = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;
      }
    });
    
    console.log('Validated metrics:', validMetrics); // Debug log

    // Calculate predictive score based on status and metrics
    const predictiveScore = calculatePredictiveScore(formData.status, validMetrics);
    
    console.log('Calculated predictive score:', predictiveScore); // Debug log
    
    const newDevice: Device = {
      id: device?.id || `device-${Date.now()}`,
      name: formData.name,
      type: formData.type as any,
      status: formData.status as any,
      location: formData.location,
      lastSeen: new Date(),
      metrics: validMetrics,
      alerts: device?.alerts || [],
      predictiveScore,
      maintenanceDate: device?.maintenanceDate || new Date(Date.now() + 30 * 24 * 3600000),
      timestamp: new Date() // Add timestamp for compatibility
    };

    console.log('Final device object:', newDevice); // Debug log

    // Call onSubmit and ensure form closes after successful submission
    onSubmit(newDevice);
  };

  const calculatePredictiveScore = (status: string, metrics: Record<string, number>): number => {
    let baseScore = 100;
    
    // Adjust score based on device status
    switch (status) {
      case 'critical':
        baseScore = 15; // Very low score for critical devices
        break;
      case 'warning':
        baseScore = 45; // Medium-low score for warning devices
        break;
      case 'offline':
        baseScore = 25; // Low score for offline devices
        break;
      case 'online':
        baseScore = 85; // Good score for online devices
        break;
      default:
        baseScore = 50;
    }
    
    // Adjust based on metrics (if any are concerning)
    const metricValues = Object.values(metrics);
    if (metricValues.length > 0) {
      const avgMetric = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
      
      // If metrics are very high (>90) or very low (<10), reduce score
      if (avgMetric > 90) {
        baseScore = Math.max(10, baseScore - 20);
      } else if (avgMetric < 10) {
        baseScore = Math.max(10, baseScore - 15);
      }
    }
    
    return Math.max(0, Math.min(100, Math.round(baseScore)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetricChange = (metric: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metric]: parseFloat(value) || 0
      }
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep the modal within viewport bounds
    const maxX = window.innerWidth - 800; // Approximate modal width
    const maxY = window.innerHeight - 600; // Approximate modal height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      cpu_usage: 'CPU Usage (%)',
      memory_usage: 'Memory Usage (%)',
      interface_bandwidth: 'Interface Bandwidth (Mbps)',
      routing_table_changes: 'Routing Table Changes',
      packet_loss: 'Packet Loss (%)',
      latency: 'Latency (ms)',
      port_status: 'Port Status (%)',
      traffic_per_port: 'Traffic per Port (Mbps)',
      broadcast_storms: 'Broadcast Storms',
      mac_table_size: 'MAC Table Size (%)',
      error_packets: 'Error Packets',
      active_sessions: 'Active Sessions',
      blocked_traffic: 'Blocked Traffic (%)',
      vpn_tunnels: 'VPN Tunnels',
      threat_detection: 'Threat Detections',
      connected_clients: 'Connected Clients',
      signal_strength: 'Signal Strength (dBm)',
      channel_utilization: 'Channel Utilization (%)',
      packet_retransmissions: 'Packet Retransmissions',
      bandwidth_usage: 'Bandwidth Usage (%)',
      active_connections: 'Active Connections',
      server_response_time: 'Server Response Time (ms)',
      throughput: 'Throughput (Mbps)',
      failed_health_checks: 'Failed Health Checks',
      traffic_distribution: 'Traffic Distribution (%)',
      traffic_forwarding_rate: 'Traffic Forwarding Rate (%)',
      protocol_translations: 'Protocol Translations',
      cpu_load: 'CPU Load (%)',
      dropped_packets: 'Dropped Packets',
      cache_hit_ratio: 'Cache Hit Ratio (%)',
      concurrent_connections: 'Concurrent Connections',
      response_time: 'Response Time (ms)',
      blocked_requests: 'Blocked Requests',
      line_status: 'Line Status (%)',
      snr: 'Signal-to-Noise Ratio (dB)',
      upstream_rate: 'Upstream Rate (Mbps)',
      downstream_rate: 'Downstream Rate (Mbps)',
      connection_uptime: 'Connection Uptime (%)',
      error_rates: 'Error Rates (%)',
      detected_threats: 'Detected Threats',
      false_positives: 'False Positives',
      signature_updates: 'Signature Updates (%)',
      active_calls: 'Active Calls',
      call_quality_mos: 'Call Quality (MOS)',
      packet_jitter: 'Packet Jitter (ms)',
      call_success_rate: 'Call Success Rate (%)',
      call_failure_rate: 'Call Failure Rate (%)',
      codec_utilization: 'Codec Utilization (%)',
      signal_amplification: 'Signal Amplification (%)',
      input_error_rate: 'Input Error Rate (%)',
      output_error_rate: 'Output Error Rate (%)',
      link_uptime: 'Link Uptime (%)',
      mac_filtering: 'MAC Filtering (%)',
      packet_forwarding_rate: 'Packet Forwarding Rate (%)',
      collision_rates: 'Collision Rates (%)',
      disk_usage: 'Disk Usage (%)',
      read_throughput: 'Read Throughput (MB/s)',
      write_throughput: 'Write Throughput (MB/s)',
      disk_temperature: 'Disk Temperature (°C)',
      error_logs: 'Error Logs',
      active_vpn_sessions: 'Active VPN Sessions',
      authentication_failures: 'Authentication Failures',
      encryption_performance: 'Encryption Performance (%)'
    };
    return labels[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDeviceTypeDescription = (type: string): string => {
    return DEVICE_TYPES[type]?.description || '';
  };

  return (
    <div className="w-full">
      <div 
        className="flex items-center justify-between mb-6 cursor-grab active:cursor-grabbing bg-gray-700 -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b border-gray-600"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center space-x-3">
          <Move className="w-5 h-5 text-gray-400" />
          <h2 className="text-2xl font-bold text-white">
            {device ? 'Edit Device' : 'Add New Device'}
          </h2>
        </div>
          <button
            onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-600 rounded"
          >
            <X className="w-6 h-6" />
          </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Device Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter device name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Device Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="" disabled>Select device type</option>
                {Object.entries(DEVICE_TYPES).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.type ? getDeviceTypeDescription(formData.type) : 'Choose a device type to see description'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Enter device location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="" disabled>Select device status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Device Metrics
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg max-h-80 overflow-y-auto">
              {currentTypeConfig?.metrics.map(metric => (
                <div key={metric}>
                  <label className="block text-xs text-gray-400 mb-1">
                    {getMetricLabel(metric)}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.metrics[metric] || ''}
                    placeholder="Enter value"
                    onChange={(e) => handleMetricChange(metric, e.target.value)}
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formData.type ? `Configure metrics specific to ${currentTypeConfig?.name || 'this device type'}` : 'Select a device type to configure metrics'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
             className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{device ? 'Update' : 'Add'} Device</span>
            </button>
          </div>
        </form>
    </div>
  );
};