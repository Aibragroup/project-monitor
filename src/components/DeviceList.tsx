import React, { useState } from 'react';
import { Device } from '../types';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  XCircle,
  Battery,
  Thermometer,
  Droplets,
  Cpu,
  HardDrive,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { DeviceForm } from './DeviceForm';

interface DeviceListProps {
  devices: Device[];
  onUpdateDevice: (device: Device) => void;
  onAddDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ 
  devices, 
  onUpdateDevice, 
  onAddDevice, 
  onDeleteDevice 
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-gray-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'warning':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleFormSubmit = (device: Device) => {
    if (isEditing) {
      onUpdateDevice(device);
    } else {
      onAddDevice(device);
    }
    setShowForm(false);
    setSelectedDevice(null);
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-orange-500';
    return 'text-red-500';
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div 
          className="absolute bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-600"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="p-6 overflow-y-auto max-h-[90vh] relative">
            <DeviceForm
              device={selectedDevice}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Device Management</h2>
        <button
          onClick={handleAddDevice}
          className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Device</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                <h3 className="text-lg font-semibold text-white">{device.name}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditDevice(device)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteDevice(device.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-white capitalize">{device.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Location</span>
                <span className="text-white">{device.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(device.status)}
                  <span className="text-white capitalize">{device.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Seen</span>
                <span className="text-white text-sm">
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(device.metrics || {}).slice(0, 4).map(([metric, value]) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-white text-sm truncate">
                      {metric.replace(/_/g, ' ')}: {typeof value === 'number' ? value.toFixed(1) : value || 'N/A'}
                    </span>
                  </div>
                ))}
                {Object.keys(device.metrics || {}).length === 0 && (
                  <div className="col-span-2 text-gray-400 text-sm text-center">
                    No metrics available
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">AI Health Score</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
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
              </div>
            </div>

            {device.alerts.filter(a => !a.resolved).length > 0 && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-400 text-sm">
                    {device.alerts.filter(a => !a.resolved).length} Active Alert(s)
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No devices found</div>
            <p className="text-gray-500 text-sm">Add your first device to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};