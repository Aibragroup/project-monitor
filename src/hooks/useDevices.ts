import { useState, useEffect } from 'react';
import { Device } from '../types';
import { useAuth } from './useAuth';
import { API_ENDPOINTS } from '../config/api';

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders, logout } = useAuth();

  const fetchDevices = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        logout();
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.DEVICES, {
        headers: authHeaders
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched devices:', data); // Debug log
        // Parse date strings to Date objects
        const parsedDevices = data.map((device: any) => ({
          ...device,
          lastSeen: new Date(device.lastSeen),
          maintenanceDate: device.maintenanceDate ? new Date(device.maintenanceDate) : undefined,
          alerts: device.alerts?.map((alert: any) => ({
            ...alert,
            timestamp: new Date(alert.timestamp)
          })) || []
        }));
        setDevices(parsedDevices);
      } else {
        console.error('Failed to fetch devices:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    if (getAuthHeaders().Authorization) {
      fetchDevices();
    }

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (getAuthHeaders().Authorization) {
        fetchDevices();
      }
    }, 30000); // Reduced polling frequency to every 30 seconds

    return () => clearInterval(interval);
  }, [getAuthHeaders]);

  const updateDevice = async (updatedDevice: Device) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.DEVICES}/${updatedDevice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedDevice),
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        await fetchDevices(); // Re-fetch to get updated data
      }
    } catch (error) {
      console.error('Failed to update device:', error);
    }
  };

  const addDevice = async (newDevice: Device) => {
    try {
      console.log('Adding device:', newDevice); // Debug log
      
      // Prepare device data for API
      const deviceData = {
        name: newDevice.name,
        type: newDevice.type,
        status: newDevice.status,
        location: newDevice.location,
        metrics: newDevice.metrics
      };
      
      console.log('Sending device data to API:', deviceData); // Debug log
      
      const response = await fetch(API_ENDPOINTS.DEVICES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(deviceData),
      });
      
      if (response.status === 401) {
        console.log('Authentication failed during device creation');
        logout();
        return;
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('Device created successfully:', result); // Debug log
        // Immediate refresh without loading state to prevent UI flicker
        await fetchDevices();
      } else {
        const errorData = await response.json();
        console.error('Failed to create device:', errorData);
      }
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.DEVICES}/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        await fetchDevices(); // Re-fetch to get updated data
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  return {
    devices,
    loading,
    updateDevice,
    addDevice,
    deleteDevice
  };
};