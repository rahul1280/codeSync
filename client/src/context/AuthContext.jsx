import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getMe = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      if (data?.token) {
        localStorage.setItem('codesync_token', data.token);
      }
      if (data && data.user) {
        setUser(data.user);
      } else if (data) {
        setUser(data);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMe();
  }, [getMe]);

  const login = async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      const loggedUser = data.user || data;
      if (data?.token) {
        localStorage.setItem('codesync_token', data.token);
      }
      setUser(loggedUser);
      toast.success('Successfully logged in!');
      return loggedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to log in. Please check your credentials.';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authApi.register(userData);
      const registeredUser = data.user || data;
      if (data?.token) {
        localStorage.setItem('codesync_token', data.token);
      }
      setUser(registeredUser);
      toast.success('Account created successfully!');
      return registeredUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('codesync_token');
      setUser(null);
      toast.info('Logged out successfully');
    } catch {
      localStorage.removeItem('codesync_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        getMe,
        setUser,
      }}
    >
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
