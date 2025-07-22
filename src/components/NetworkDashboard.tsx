import React, { useState, useEffect } from 'react';
import { NetworkOverview } from '../types';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Wifi,
  Clock,
  BarChart3,
  Globe,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const NetworkDashboard: React.FC = () => {
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    fetchNetworkOverview();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNetworkOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkOverview = async () => {
    try {
      const response = await fetch('/api/network-overview', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Failed to fetch network overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Network Dashboard</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading network overview...</div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Network Dashboard</h2>
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Network Data</h3>
          <p className="text-gray-400">Network overview data is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Globe className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">Network Dashboard</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Traffic</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(overview.totalTraffic).toLocaleString()} Mbps
          </div>
          <div className="text-sm text-blue-400 mt-1">Last 24 hours</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Network Uptime</h3>
            <Wifi className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(overview.networkUptime)}%
          </div>
          <div className="text-sm text-green-400 mt-1">Average uptime</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Critical Events</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-white">{overview.criticalEvents}</div>
          <div className="text-sm text-red-400 mt-1">Requires attention</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Peak Hour</h3>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {overview.hourlyTraffic.length > 0 
              ? `${overview.hourlyTraffic.reduce((max, curr) => curr.traffic > max.traffic ? curr : max).hour}:00`
              : 'N/A'
            }
          </div>
          <div className="text-sm text-purple-400 mt-1">Highest traffic</div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>24-Hour Traffic Trend</span>
        </h3>
        <div className="relative h-64">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {overview.hourlyTraffic.length > 1 && (
              <>
                {/* Area fill */}
                <path
                  d={`M 0,256 ${overview.hourlyTraffic
                    .map((d, i) => `L ${(i / 23) * 100}%,${256 - (d.traffic / 100) * 256}`)
                    .join(' ')} L 100%,256 Z`}
                  fill="url(#trafficGradient)"
                />
                
                {/* Line */}
                <path
                  d={`M 0,${256 - (overview.hourlyTraffic[0]?.traffic || 0 / 100) * 256} ${overview.hourlyTraffic
                    .map((d, i) => `L ${(i / 23) * 100}%,${256 - (d.traffic / 100) * 256}`)
                    .join(' ')}`}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                />
                
                {/* Data points */}
                {overview.hourlyTraffic.map((d, i) => (
                  <circle
                    key={i}
                    cx={`${(i / 23) * 100}%`}
                    cy={256 - (d.traffic / 100) * 256}
                    r="3"
                    fill="rgb(59, 130, 246)"
                  />
                ))}
              </>
            )}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 mt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      {/* Top Bandwidth Consumers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Top Bandwidth Consumers</span>
          </h3>
          <div className="space-y-4">
            {overview.topConsumers.length > 0 ? (
              overview.topConsumers.map((consumer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-orange-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">{consumer.name}</p>
                      <p className="text-gray-400 text-sm capitalize">{consumer.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {Math.round(consumer.avgBandwidth)} Mbps
                    </p>
                    <p className="text-gray-400 text-xs">Average</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                No bandwidth data available
              </div>
            )}
          </div>
        </div>

        {/* Network Health Summary */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Network Health Summary</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-white">Overall Uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-600 rounded-full h-2">
                  <div 
                    className="h-full rounded-full bg-green-500" 
                    style={{ width: `${overview.networkUptime}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm">{Math.round(overview.networkUptime)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="text-white">Traffic Load</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-600 rounded-full h-2">
                  <div 
                    className="h-full rounded-full bg-blue-500" 
                    style={{ width: `${Math.min(100, (overview.totalTraffic / 1000) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm">
                  {Math.round((overview.totalTraffic / 1000) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`w-5 h-5 ${overview.criticalEvents > 0 ? 'text-red-500' : 'text-green-500'}`} />
                <span className="text-white">System Health</span>
              </div>
              <span className={`text-sm font-semibold ${overview.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {overview.criticalEvents > 0 ? `${overview.criticalEvents} Issues` : 'Healthy'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span className="text-white">Peak Performance</span>
              </div>
              <span className="text-white text-sm">
                {overview.hourlyTraffic.length > 0 
                  ? `${Math.round(Math.max(...overview.hourlyTraffic.map(h => h.traffic)))} Mbps`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};