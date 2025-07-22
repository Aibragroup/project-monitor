import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const storedToken = localStorage.getItem('auth_token');
    const tokenExpires = localStorage.getItem('token_expires');
    
    if (storedToken && tokenExpires) {
      const expirationTime = parseInt(tokenExpires);
      const currentTime = Date.now();
      
      // Add 5 minute buffer to prevent edge cases
      if (currentTime < (expirationTime - 300000)) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired, clear storage
        logout();
      }
    }
    
    setLoading(false);
  };

  const login = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('token_expires');
    setToken(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const currentToken = token || localStorage.getItem('auth_token');
    return currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {};
  };

  // Add method to check if token is valid
  const isTokenValid = () => {
    const tokenExpires = localStorage.getItem('token_expires');
    if (!tokenExpires) return false;
    
    const expirationTime = parseInt(tokenExpires);
    const currentTime = Date.now();
    return currentTime < (expirationTime - 300000); // 5 minute buffer
  };

  return {
    isAuthenticated,
    loading,
    token,
    login,
    logout,
    getAuthHeaders,
    isTokenValid
  };
};