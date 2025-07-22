import React, { useState, useEffect } from 'react';
import { BandwidthPrediction } from '../types';
import { 
  TrendingUp, 
  Brain, 
  Calendar,
  Activity,
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const BandwidthPredictor: React.FC = () => {
  const [predictions, setPredictions] = useState<BandwidthPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const { getAuthHeaders, logout } = useAuth();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/bandwidth-predictions', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-bandwidth-predictions', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Predictions generated:', result);
        await fetchPredictions(); // Refresh predictions
      }
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredPredictions = selectedDevice === 'all' 
    ? predictions 
    : predictions.filter(p => p.deviceId === selectedDevice);

  const uniqueDevices = Array.from(new Set(predictions.map(p => p.deviceId)))
    .map(deviceId => predictions.find(p => p.deviceId === deviceId)!)
    .filter(Boolean);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertCircle;
    return AlertCircle;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">AI Bandwidth Predictor</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading predictions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">AI Bandwidth Predictor</h2>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Devices</option>
            {uniqueDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.deviceName}
              </option>
            ))}
          </select>
          <button
            onClick={generatePredictions}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating...' : 'Generate Predictions'}</span>
          </button>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Predictions Available</h3>
          <p className="text-gray-400 mb-4">
            Generate AI-powered bandwidth predictions based on historical device data.
          </p>
          <button
            onClick={generatePredictions}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Brain className="w-5 h-5" />
            <span>Generate First Predictions</span>
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Total Predictions</h3>
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-white">{filteredPredictions.length}</div>
              <div className="text-sm text-purple-400 mt-1">Next 7 days</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Avg Confidence</h3>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-white">
                {filteredPredictions.length > 0 
                  ? Math.round((filteredPredictions.reduce((sum, p) => sum + p.confidenceScore, 0) / filteredPredictions.length) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-green-400 mt-1">AI Accuracy</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Peak Prediction</h3>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-white">
                {filteredPredictions.length > 0 
                  ? Math.round(Math.max(...filteredPredictions.map(p => p.predictedBandwidth)))
                  : 0} Mbps
              </div>
              <div className="text-sm text-orange-400 mt-1">Maximum expected</div>
            </div>
          </div>

          {/* Predictions Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">7-Day Bandwidth Forecast</h3>
            <div className="relative h-64">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="bandwidthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {filteredPredictions.length > 1 && (
                  <>
                    <path
                      d={`M 0,${256 - (filteredPredictions[0].predictedBandwidth / 100) * 256} ${filteredPredictions
                        .map((p, i) => `L ${(i / (filteredPredictions.length - 1)) * 100}%,${256 - (p.predictedBandwidth / 100) * 256}`)
                        .join(' ')} L 100%,256 L 0,256 Z`}
                      fill="url(#bandwidthGradient)"
                    />
                    <path
                      d={`M 0,${256 - (filteredPredictions[0].predictedBandwidth / 100) * 256} ${filteredPredictions
                        .map((p, i) => `L ${(i / (filteredPredictions.length - 1)) * 100}%,${256 - (p.predictedBandwidth / 100) * 256}`)
                        .join(' ')}`}
                      fill="none"
                      stroke="rgb(147, 51, 234)"
                      strokeWidth="3"
                    />
                    {filteredPredictions.map((p, i) => (
                      <circle
                        key={i}
                        cx={`${(i / (filteredPredictions.length - 1)) * 100}%`}
                        cy={256 - (p.predictedBandwidth / 100) * 256}
                        r="4"
                        fill="rgb(147, 51, 234)"
                      />
                    ))}
                  </>
                )}
              </svg>
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 mt-2">
                <span>Today</span>
                <span>7 Days</span>
              </div>
            </div>
          </div>

          {/* Detailed Predictions Table */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Predictions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 pb-3">Device</th>
                    <th className="text-left text-gray-400 pb-3">Date</th>
                    <th className="text-left text-gray-400 pb-3">Predicted Bandwidth</th>
                    <th className="text-left text-gray-400 pb-3">Confidence</th>
                    <th className="text-left text-gray-400 pb-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPredictions.map((prediction) => {
                    const ConfidenceIcon = getConfidenceIcon(prediction.confidenceScore);
                    return (
                      <tr key={prediction.id} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <div>
                            <div className="text-white font-medium">{prediction.deviceName}</div>
                            <div className="text-gray-400 text-xs">{prediction.location}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-white">
                              {new Date(prediction.predictionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-white font-medium">
                            {Math.round(prediction.predictedBandwidth)} Mbps
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <ConfidenceIcon className={`w-4 h-4 ${getConfidenceColor(prediction.confidenceScore)}`} />
                            <span className={`font-medium ${getConfidenceColor(prediction.confidenceScore)}`}>
                              {Math.round(prediction.confidenceScore * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 capitalize">
                            {prediction.deviceType}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};