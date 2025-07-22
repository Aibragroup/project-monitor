import React from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  BarChart3, 
  Settings,
  Shield,
  LogOut,
  User,
  Globe,
  Brain,
  Search,
  Router
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: Monitor },
    { id: 'network', label: 'Network', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'bandwidth', label: 'AI Predictor', icon: Brain },
    { id: 'ip-tracker', label: 'IP Tracker', icon: Search },
    { id: 'tr069', label: 'TR-069', icon: Router },
    { id: 'maintenance', label: 'Maintenance', icon: Settings }
  ];

  const username = localStorage.getItem('username') || 'Admin';

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">EdgeMonitor AI</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            </div>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{username}</span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};