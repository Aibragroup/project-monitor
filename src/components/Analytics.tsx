import React, { useState, useEffect } from 'react';
import { Device, AnalyticsData } from '../types';
import { generateAnalyticsData } from '../utils/mockData';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsProps {
  devices: Device[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ devices }) => {
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0]?.id || '');
  const [selectedMetric, setSelectedMetric] = useState<string>('temperature');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    if (selectedDevice && selectedMetric) {
      fetchAnalyticsData();
    }
  }, [selectedDevice, selectedMetric]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/${selectedDevice}/${selectedMetric}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const parsedData = data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setAnalyticsData(parsedData);
      } else {
        // Fallback to mock data if API fails
        const data = generateAnalyticsData(selectedDevice, selectedMetric);
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // Fallback to mock data
      const data = generateAnalyticsData(selectedDevice, selectedMetric);
      setAnalyticsData(data);
    }
  };

  const getCurrentValue = () => {
    if (analyticsData.length === 0) return 0;
    return analyticsData[analyticsData.length - 1].value;
  };

  const getPreviousValue = () => {
    if (analyticsData.length < 2) return 0;
    return analyticsData[analyticsData.length - 2].value;
  };

  const getTrend = () => {
    const current = getCurrentValue();
    const previous = getPreviousValue();
    return current - previous;
  };

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'battery':
        return '%';
      case 'cpu':
        return '%';
      case 'memory':
        return '%';
      default:
        return '';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'temperature':
        return 'text-orange-500';
      case 'humidity':
        return 'text-blue-500';
      case 'battery':
        return 'text-green-500';
      case 'cpu':
        return 'text-purple-500';
      case 'memory':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const maxValue = Math.max(...analyticsData.map(d => d.value));
  const minValue = Math.min(...analyticsData.map(d => d.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            {devices.map(device => (
              <option key={device.id} value={device.id}>{device.name}</option>
            ))}
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="battery">Battery</option>
            <option value="cpu">CPU Usage</option>
            <option value="memory">Memory Usage</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Current Value</h3>
            <Activity className={`w-5 h-5 ${getMetricColor(selectedMetric)}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {getCurrentValue().toFixed(1)}{getMetricUnit(selectedMetric)}
          </div>
          <div className="flex items-center mt-2">
            {getTrend() > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${getTrend() > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(getTrend()).toFixed(1)}{getMetricUnit(selectedMetric)}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Maximum</h3>
            <BarChart3 className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {maxValue.toFixed(1)}{getMetricUnit(selectedMetric)}
          </div>
          <div className="text-sm text-gray-500 mt-2">Last 24 hours</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Minimum</h3>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {minValue.toFixed(1)}{getMetricUnit(selectedMetric)}
          </div>
          <div className="text-sm text-gray-500 mt-2">Last 24 hours</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Average</h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(analyticsData.reduce((sum, d) => sum + d.value, 0) / analyticsData.length).toFixed(1)}{getMetricUnit(selectedMetric)}
          </div>
          <div className="text-sm text-gray-500 mt-2">Last 24 hours</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
        </h3>
        <div className="relative h-64">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {analyticsData.length > 1 && (
              <>
                <path
                  d={`M 0,${256 - (analyticsData[0].value / 100) * 256} ${analyticsData
                    .map((d, i) => `L ${(i / (analyticsData.length - 1)) * 100}%,${256 - (d.value / 100) * 256}`)
                    .join(' ')} L 100%,256 L 0,256 Z`}
                  fill="url(#areaGradient)"
                />
                <path
                  d={`M 0,${256 - (analyticsData[0].value / 100) * 256} ${analyticsData
                    .map((d, i) => `L ${(i / (analyticsData.length - 1)) * 100}%,${256 - (d.value / 100) * 256}`)
                    .join(' ')}`}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                />
                {analyticsData.map((d, i) => (
                  <circle
                    key={i}
                    cx={`${(i / (analyticsData.length - 1)) * 100}%`}
                    cy={256 - (d.value / 100) * 256}
                    r="3"
                    fill="rgb(59, 130, 246)"
                  />
                ))}
              </>
            )}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 mt-2">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};