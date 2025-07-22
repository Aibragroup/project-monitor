import React, { useState, useEffect } from 'react';
import { TrackedDevice } from '../types';
import { 
  Search, 
  Filter,
  Globe,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const IPTracker: React.FC = () => {
  const [devices, setDevices] = useState<TrackedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchIP, setSearchIP] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    fetchDevices();
  }, [searchIP, searchName, filterType]);

  const fetchDevices = async () => {
    try {
      const params = new URLSearchParams();
      if (searchIP) params.append('ip', searchIP);
      if (searchName) params.append('name', searchName);
      if (filterType) params.append('type', filterType);

      const response = await fetch(`/api/ip-tracker?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to fetch IP tracker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'offline':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'warning':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredDevices = devices.filter(device => {
    if (filterStatus && device.status !== filterStatus) return false;
    return true;
  });

  const deviceTypes = Array.from(new Set(devices.map(d => d.type)));
  const deviceStatuses = ['online', 'offline', 'warning', 'critical'];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">IP Device Tracker</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading device tracker...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Globe className="w-8 h-8 text-cyan-500" />
        <h2 className="text-2xl font-bold text-white">IP Device Tracker</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search by IP
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                placeholder="192.168.1.1"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search by Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Device name"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Type
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Types</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Statuses</option>
                {deviceStatuses.map(status => (
                  <option key={status} value={status} className="capitalize">
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Devices</h3>
            <Globe className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-white">{filteredDevices.length}</div>
          <div className="text-sm text-cyan-400 mt-1">Tracked devices</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Online</h3>
            <Wifi className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {filteredDevices.filter(d => d.status === 'online').length}
          </div>
          <div className="text-sm text-green-400 mt-1">Active now</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Offline</h3>
            <WifiOff className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {filteredDevices.filter(d => d.status === 'offline').length}
          </div>
          <div className="text-sm text-red-400 mt-1">Disconnected</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Avg Latency</h3>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {filteredDevices.length > 0 
              ? Math.round(filteredDevices.reduce((sum, d) => sum + d.avgLatency, 0) / filteredDevices.length)
              : 0
            }ms
          </div>
          <div className="text-sm text-purple-400 mt-1">Response time</div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Device Details</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Device</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">IP Address</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Status</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Type</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Location</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Last Seen</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Health</th>
                <th className="text-left text-gray-300 px-6 py-3 font-medium">Metrics</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(device.status)}
                      <div>
                        <div className="text-white font-medium">{device.name}</div>
                        <div className="text-gray-400 text-sm">ID: {device.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-mono">{device.ipAddress}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                      {device.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300 capitalize">
                      {device.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{device.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm">
                      {new Date(device.lastSeen).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            device.predictiveScore > 70 ? 'bg-green-500' : 
                            device.predictiveScore > 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${device.predictiveScore}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">{device.predictiveScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      <div>Latency: {Math.round(device.avgLatency)}ms</div>
                      <div>Loss: {device.avgPacketLoss.toFixed(1)}%</div>
                      <div>Metrics: {device.metricCount}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Devices Found</h3>
              <p className="text-gray-400">
                {searchIP || searchName || filterType || filterStatus 
                  ? 'No devices match your search criteria.' 
                  : 'No devices are currently being tracked.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};