import React, { useState } from 'react';
import { Login } from './components/Login';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { DeviceList } from './components/DeviceList';
import { Analytics } from './components/Analytics';
import { Maintenance } from './components/Maintenance';
import { BandwidthPredictor } from './components/BandwidthPredictor';
import { NetworkDashboard } from './components/NetworkDashboard';
import { IPTracker } from './components/IPTracker';
import { TR069Manager } from './components/TR069Manager';
import { useDevices } from './hooks/useDevices';
import { useAuth } from './hooks/useAuth';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAuthenticated, loading: authLoading, login, logout } = useAuth();
  const { devices, loading, updateDevice, addDevice, deleteDevice } = useDevices();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={(token: string) => login(token)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading devices...</div>
          </div>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard devices={devices} />;
      case 'devices':
        return (
          <DeviceList 
            devices={devices} 
            onUpdateDevice={updateDevice}
            onAddDevice={addDevice}
            onDeleteDevice={deleteDevice}
          />
        );
      case 'analytics':
        return <Analytics devices={devices} />;
      case 'maintenance':
        return <Maintenance devices={devices} />;
      case 'bandwidth':
        return <BandwidthPredictor />;
      case 'network':
        return <NetworkDashboard />;
      case 'ip-tracker':
        return <IPTracker />;
      case 'tr069':
        return <TR069Manager />;
      default:
        return <Dashboard devices={devices} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;