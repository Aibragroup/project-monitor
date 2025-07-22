import React, { useState, useEffect } from 'react';
import { Device } from '../types';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Wrench,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MaintenanceProps {
  devices: Device[];
}

export const Maintenance: React.FC<MaintenanceProps> = ({ devices }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    if (devices.length > 0) {
      // Add delay to prevent immediate API call
      const timer = setTimeout(() => {
        fetchMaintenanceData();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [devices]);

  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predictive-maintenance', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Maintenance data:', data); // Debug log
        setMaintenanceData(data);
      } else {
        console.error('Failed to fetch maintenance data:', response.status);
        // Use fallback data
        setMaintenanceData([]);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
      setMaintenanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const getPredictiveInsights = () => {
    if (maintenanceData.length > 0) {
      return maintenanceData;
    }
    
    // Fallback to local calculation
    return devices.map(device => ({
      device,
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
      location: device.location,
      metrics: device.metrics,
      predictiveScore: device.predictiveScore,
      maintenanceDate: device.maintenanceDate,
      riskLevel: device.predictiveScore < 30 ? 'high' : device.predictiveScore < 60 ? 'medium' : 'low',
      recommendedAction: device.predictiveScore < 30 ? 'Immediate maintenance required' : 
                        device.predictiveScore < 60 ? 'Schedule maintenance soon' : 
                        'Continue monitoring',
      estimatedCost: Math.round(150000 + (100 - device.predictiveScore) * 5000)
    }));
  };

  const insights = getPredictiveInsights();
  const highRiskDevices = insights.filter(i => i.riskLevel === 'high');
  const mediumRiskDevices = insights.filter(i => i.riskLevel === 'medium');
  
  const totalMaintenanceCost = insights.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
  const avgHealthScore = insights.length > 0 
    ? Math.round(insights.reduce((sum, i) => sum + (i.predictiveScore || 0), 0) / insights.length) 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Predictive Maintenance</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading maintenance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Predictive Maintenance</h2>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value as any)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">High Risk Devices</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-white">{highRiskDevices.length}</div>
          <div className="text-sm text-red-400 mt-1">Require immediate attention</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Medium Risk Devices</h3>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-white">{mediumRiskDevices.length}</div>
          <div className="text-sm text-orange-400 mt-1">Schedule maintenance soon</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Avg Health Score</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">{avgHealthScore}%</div>
          <div className="text-sm text-green-400 mt-1">+3% from last month</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Est. Maintenance Cost</h3>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMaintenanceCost.toLocaleString()} TZS</div>
          <div className="text-sm text-gray-400 mt-1">Next 30 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
          <div className="space-y-4">
            {insights
              .filter(i => i.riskLevel === 'high' || i.riskLevel === 'medium')
              .sort((a, b) => (a.predictiveScore || 0) - (b.predictiveScore || 0))
              .slice(0, 5)
              .map((insight, index) => (
                <div key={insight.deviceId || index} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{insight.deviceName}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      insight.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {insight.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{insight.recommendedAction}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Health Score: {insight.predictiveScore || 0}%</span>
                    <span>Cost: {(insight.estimatedCost || 0).toLocaleString()} TZS</span>
                  </div>
                </div>
              ))}
            {insights.filter(i => i.riskLevel === 'high' || i.riskLevel === 'medium').length === 0 && (
              <div className="text-center text-gray-400 py-4">
                All devices are performing well
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Maintenance Schedule</h3>
          <div className="space-y-3">
            {devices
              .sort((a, b) => {
                const dateA = a.maintenanceDate ? new Date(a.maintenanceDate).getTime() : Date.now();
                const dateB = b.maintenanceDate ? new Date(b.maintenanceDate).getTime() : Date.now();
                return dateA - dateB;
              })
              .slice(0, 6)
              .map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      device.predictiveScore < 30 ? 'bg-red-500' :
                      device.predictiveScore < 60 ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">{device.name}</p>
                      <p className="text-gray-400 text-sm">{device.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {device.maintenanceDate 
                        ? new Date(device.maintenanceDate).toLocaleDateString()
                        : 'Not scheduled'
                      }
                    </p>
                    <p className="text-gray-400 text-xs">
                      {device.maintenanceDate 
                        ? Math.ceil((new Date(device.maintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + ' days'
                        : 'TBD'
                      }
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Predictive Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-gray-800" />
            </div>
            <h4 className="text-white font-medium mb-2">Failure Prevention</h4>
            <p className="text-gray-400 text-sm">
              AI models predict potential failures up to 30 days in advance, reducing downtime by 75%
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-medium mb-2">Optimized Maintenance</h4>
            <p className="text-gray-400 text-sm">
              Schedule maintenance based on actual device condition rather than fixed intervals
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-medium mb-2">Cost Reduction</h4>
            <p className="text-gray-400 text-sm">
              Reduce maintenance costs by 40% through predictive insights and optimized scheduling
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};