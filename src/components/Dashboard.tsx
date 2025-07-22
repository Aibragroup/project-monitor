import React, { useState, useEffect } from 'react';
import { Device, DashboardStats } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Shield,
  Wifi
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  devices: Device[];
}

export const Dashboard: React.FC<DashboardProps> = ({ devices }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    totalAlerts: 0,
    avgHealthScore: 0,
    statusDistribution: {}
  });
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    // Add a small delay to prevent immediate API call after devices load
    const timer = setTimeout(() => {
      fetchDashboardStats();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [devices]);

  const fetchDashboardStats = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        calculateLocalStats();
        return;
      }
      
      const response = await fetch('/api/dashboard-stats', {
        headers: authHeaders
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard stats:', data); // Debug log
        setStats(data);
      } else {
        // Fallback to local calculation
        console.log('Using local stats calculation');
        calculateLocalStats();
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      calculateLocalStats();
    }
  };

  const calculateLocalStats = () => {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const totalAlerts = devices.reduce((sum, device) => sum + (device.alerts?.filter(a => !a.resolved).length || 0), 0);
    const avgHealthScore = totalDevices > 0 
      ? Math.round(devices.reduce((sum, d) => sum + (d.predictiveScore || 0), 0) / totalDevices)
      : 0;

    const statusDistribution = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalDevices,
      onlineDevices,
      totalAlerts,
      avgHealthScore,
      statusDistribution
    });
  };

  const uptimePercentage = stats.totalDevices > 0 
    ? Math.round((stats.onlineDevices / stats.totalDevices) * 100)
    : 0;

  const statsCards = [
    {
      title: 'Total Devices',
      value: stats.totalDevices,
      icon: Activity,
      color: 'bg-white',
      iconColor: 'text-gray-800',
      change: `${stats.totalDevices} network devices`
    },
    {
      title: 'Online',
      value: stats.onlineDevices,
      icon: CheckCircle,
      color: 'bg-green-500',
      iconColor: 'text-white',
      change: `${uptimePercentage}% uptime`
    },
    {
      title: 'Active Alerts',
      value: stats.totalAlerts,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      iconColor: 'text-white',
      change: stats.totalAlerts === 0 ? 'All systems normal' : 'Requires attention'
    },
    {
      title: 'Health Score',
      value: `${stats.avgHealthScore}%`,
      icon: TrendingUp,
      color: 'bg-white',
      iconColor: 'text-gray-800',
      change: stats.avgHealthScore > 70 ? 'Good health' : stats.avgHealthScore > 40 ? 'Fair health' : 'Poor health'
    }
  ];

  const statusStats = [
    { label: 'Online', value: stats.statusDistribution.online || 0, color: 'text-green-500', icon: Wifi },
    { label: 'Warning', value: stats.statusDistribution.warning || 0, color: 'text-orange-500', icon: AlertTriangle },
    { label: 'Critical', value: stats.statusDistribution.critical || 0, color: 'text-red-500', icon: XCircle },
    { label: 'Offline', value: stats.statusDistribution.offline || 0, color: 'text-gray-500', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Device Status Distribution</h3>
          <div className="space-y-4">
            {statusStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-gray-300">{stat.label}</span>
                </div>
                <span className="text-white font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">High Priority Devices</h3>
          <div className="space-y-4">
            {devices
              .filter(d => d.predictiveScore < 70)
              .sort((a, b) => a.predictiveScore - b.predictiveScore)
              .slice(0, 5)
              .map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{device.name}</p>
                    <p className="text-gray-400 text-sm">{device.location}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      device.predictiveScore < 30 ? 'text-red-500' : 
                      device.predictiveScore < 60 ? 'text-orange-500' : 'text-yellow-500'
                    }`}>
                      {device.predictiveScore}%
                    </div>
                    <div className="text-xs text-gray-400">Health Score</div>
                  </div>
                </div>
              ))}
            {devices.filter(d => d.predictiveScore < 70).length === 0 && (
              <div className="text-center text-gray-400 py-4">
                All devices are performing well
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {devices
            .flatMap(device => device.alerts.map(alert => ({ ...alert, deviceName: device.name })))
            .filter(alert => !alert.resolved)
            .sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime();
              const dateB = new Date(b.timestamp).getTime();
              return dateB - dateA;
            })
            .slice(0, 5)
            .map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.type === 'critical' ? 'text-red-500' : 
                    alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{alert.message}</p>
                    <p className="text-gray-400 text-sm">{alert.deviceName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          {devices.flatMap(d => d.alerts || []).filter(a => !a.resolved).length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No active alerts
            </div>
          )}
        </div>
      </div>
    </div>
  );
};