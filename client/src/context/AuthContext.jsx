import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('pams_token');
      const savedUser = localStorage.getItem('pams_user');
      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally verify with server
          const current = await api.getCurrentUser().catch(() => null);
          if (current) {
            setUser(current);
            localStorage.setItem('pams_user', JSON.stringify(current));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    localStorage.setItem('pams_token', data.token);
    localStorage.setItem('pams_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pams_token');
    localStorage.removeItem('pams_user');
    setUser(null);
  };

  const switchRole = async (targetRole) => {
    // Quick helper for demo purposes to switch to demo role account
    try {
      const demoUsers = await api.getDemoUsers();
      const match = demoUsers.find(u => u.role === targetRole);
      if (match) {
        await login({ email: match.email, password: match.password, role: match.role });
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
