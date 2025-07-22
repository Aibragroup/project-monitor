import React, { useState } from 'react';
import { 
  Router, 
  Wifi, 
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader,
  Settings,
  Zap,
  Globe,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TR069Device {
  id: string;
  deviceId: string;
  serialNumber: string;
  manufacturer: string;
  modelName: string;
  softwareVersion: string;
  macAddress: string;
  ipAddress: string;
  connectionRequestUrl: string;
  lastInform: string;
  parameterList: Record<string, string>;
  status: string;
  deviceName: string;
  location: string;
}

interface SimulationData {
  serial_number: string;
  manufacturer: string;
  model_name: string;
  software_version: string;
  ip_address: string;
  mac_address: string;
  connection_request_url: string;
}

export const TR069Manager: React.FC = () => {
  const [devices, setDevices] = useState<TR069Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [simulationData, setSimulationData] = useState<SimulationData>({
    serial_number: 'SIM001',
    manufacturer: 'Huawei',
    model_name: 'HG8245H',
    software_version: 'V3R017C10S115',
    ip_address: '192.168.1.100',
    mac_address: '00:11:22:33:44:55',
    connection_request_url: 'http://192.168.1.100:7547/'
  });
  const [activeTab, setActiveTab] = useState<'devices' | 'parameters' | 'simulate'>('devices');
  const { getAuthHeaders, logout } = useAuth();

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tr069/devices', {
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
      console.error('Failed to fetch TR-069 devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/tr069/connection-request/${deviceId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('Connection request sent successfully');
      } else {
        const error = await response.json();
        alert(`Failed to send connection request: ${error.error}`);
      }
    } catch (error) {
      alert('Network error sending connection request');
    }
  };

  const rebootDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to reboot this device?')) return;

    try {
      const response = await fetch(`/api/tr069/devices/${deviceId}/reboot`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('Reboot command sent successfully');
      } else {
        const error = await response.json();
        alert(`Failed to reboot device: ${error.error}`);
      }
    } catch (error) {
      alert('Network error rebooting device');
    }
  };

  const setDeviceParameters = async () => {
    if (!selectedDevice || Object.keys(parameters).length === 0) {
      alert('Please select a device and enter parameters');
      return;
    }

    try {
      const response = await fetch(`/api/tr069/devices/${selectedDevice}/parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ parameters })
      });

      if (response.ok) {
        alert('Parameter update initiated successfully');
        setParameters({});
      } else {
        const error = await response.json();
        alert(`Failed to set parameters: ${error.error}`);
      }
    } catch (error) {
      alert('Network error setting parameters');
    }
  };

  const simulateDevice = async () => {
    try {
      const response = await fetch('/api/tr069/simulate-inform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(simulationData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Simulated device registered: ${result.device_id}`);
        fetchDevices(); // Refresh device list
      } else {
        const error = await response.json();
        alert(`Simulation failed: ${error.error}`);
      }
    } catch (error) {
      alert('Network error during simulation');
    }
  };

  const addParameter = () => {
    const name = prompt('Enter parameter name (e.g., Device.WiFi.SSID.1.SSID):');
    const value = prompt('Enter parameter value:');
    
    if (name && value) {
      setParameters(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeParameter = (name: string) => {
    setParameters(prev => {
      const newParams = { ...prev };
      delete newParams[name];
      return newParams;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Router className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">TR-069 (CWMP) Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'devices'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Managed Devices
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'parameters'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Parameter Management
        </button>
        <button
          onClick={() => setActiveTab('simulate')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'simulate'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Device Simulation
        </button>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">TR-069 Managed Devices</h3>
            <button
              onClick={fetchDevices}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <Router className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No TR-069 Devices</h3>
              <p className="text-gray-400 mb-4">
                No devices have sent Inform messages to this ACS yet.
              </p>
              <p className="text-gray-500 text-sm">
                Configure your CPE devices to connect to: <code>http://your-server:5000/api/tr069/inform</code>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {devices.map((device) => (
                <div key={device.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{device.deviceName}</h4>
                      <p className="text-gray-400 text-sm">{device.manufacturer} {device.modelName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'online' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {device.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Serial Number:</span>
                      <span className="text-white font-mono">{device.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Address:</span>
                      <span className="text-white font-mono">{device.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Software Version:</span>
                      <span className="text-white">{device.softwareVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Inform:</span>
                      <span className="text-white">
                        {new Date(device.lastInform).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => sendConnectionRequest(device.deviceId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => rebootDevice(device.deviceId)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Reboot</span>
                    </button>
                  </div>

                  {/* Parameter Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Key Parameters</h5>
                    <div className="space-y-1 text-xs">
                      {Object.entries(device.parameterList).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 truncate">{key.split('.').pop()}:</span>
                          <span className="text-white ml-2">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parameters Tab */}
      {activeTab === 'parameters' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Parameter Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Device
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a device...</option>
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.deviceName} ({device.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Parameters to Set
                  </label>
                  <button
                    onClick={addParameter}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(parameters).map(([name, value]) => (
                    <div key={name} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={name}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setParameters(prev => ({ ...prev, [name]: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => removeParameter(name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {Object.keys(parameters).length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      No parameters added. Click "Add" to add parameters.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={setDeviceParameters}
                disabled={!selectedDevice || Object.keys(parameters).length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg"
              >
                Set Parameters
              </button>
            </div>
          </div>

          {/* Common Parameters Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h4 className="text-md font-semibold text-white mb-3">Quick Parameter Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setParameters({
                  'Device.WiFi.SSID.1.SSID': 'NewNetworkName',
                  'Device.WiFi.AccessPoint.1.Security.ModeEnabled': 'WPA2-PSK',
                  'Device.WiFi.AccessPoint.1.Security.KeyPassphrase': 'newpassword123'
                })}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left"
              >
                <div className="text-white font-medium">WiFi Configuration</div>
                <div className="text-gray-400 text-sm">Set SSID and password</div>
              </button>
              
              <button
                onClick={() => setParameters({
                  'Device.ManagementServer.PeriodicInformEnable': 'true',
                  'Device.ManagementServer.PeriodicInformInterval': '300'
                })}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left"
              >
                <div className="text-white font-medium">Inform Settings</div>
                <div className="text-gray-400 text-sm">Configure periodic inform</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Tab */}
      {activeTab === 'simulate' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Device Simulation</h3>
          <p className="text-gray-400 mb-6">
            Simulate a TR-069 device sending an Inform message to test the ACS functionality.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number</label>
              <input
                type="text"
                value={simulationData.serial_number}
                onChange={(e) => setSimulationData(prev => ({ ...prev, serial_number: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Manufacturer</label>
              <input
                type="text"
                value={simulationData.manufacturer}
                onChange={(e) => setSimulationData(prev => ({ ...prev, manufacturer: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
              <input
                type="text"
                value={simulationData.model_name}
                onChange={(e) => setSimulationData(prev => ({ ...prev, model_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Software Version</label>
              <input
                type="text"
                value={simulationData.software_version}
                onChange={(e) => setSimulationData(prev => ({ ...prev, software_version: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
              <input
                type="text"
                value={simulationData.ip_address}
                onChange={(e) => setSimulationData(prev => ({ ...prev, ip_address: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">MAC Address</label>
              <input
                type="text"
                value={simulationData.mac_address}
                onChange={(e) => setSimulationData(prev => ({ ...prev, mac_address: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>
          
          <button
            onClick={simulateDevice}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Simulate Device Registration</span>
          </button>
        </div>
      )}

      {/* Information Panel */}
      {/*<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">About TR-069 (CWMP)</h3>
        <div className="space-y-3 text-gray-300">
          <p>
            TR-069 (Technical Report 069) is the CPE WAN Management Protocol (CWMP) that enables remote management 
            of customer premises equipment (CPE) from an Auto Configuration Server (ACS).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Key Features:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Remote device configuration</li>
                <li>• Firmware management</li>
                <li>• Performance monitoring</li>
                <li>• Fault management</li>
                <li>• Software/firmware downloads</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Supported Operations:</h4>
              <ul className="space-y-1 text-sm">
                <li>• GetParameterValues</li>
                <li>• SetParameterValues</li>
                <li>• Reboot device</li>
                <li>• Factory reset</li>
                <li>• Connection requests</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>ACS Endpoint:</strong> Configure your CPE devices to connect to: 
              <code className="ml-2 bg-gray-700 px-2 py-1 rounded">http://your-server:5000/api/tr069/inform</code>
            </p>
          </div>
        </div>
      </div>*/}
    </div>
  );
};