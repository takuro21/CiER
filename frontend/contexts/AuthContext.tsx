'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      checkAuth();
    }
  }, [isClient]);

  const checkAuth = async () => {
    if (!isClient) return;
    
    const token = Cookies.get('access_token');
    if (token) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth check failed:', error);
        }
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      }
    }
    setIsLoading(false);
  };

    const login = async (username: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Starting login process...');
      console.log('🔐 Username:', username);
      console.log('🔐 API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await authAPI.login({ username, password });
      
      console.log('🔐 AuthContext: Raw response:', response);
      console.log('🔐 AuthContext: Response status:', response.status);
      console.log('🔐 AuthContext: Response data:', response.data);
      
      const { user: userData, tokens } = response.data;
      const { access, refresh } = tokens;
      
      console.log('🔐 AuthContext: Extracted user data:', userData);
      console.log('🔐 AuthContext: Extracted tokens:', { access: access?.substring(0, 20) + '...', refresh: refresh?.substring(0, 20) + '...' });
      
      Cookies.set('access_token', access);
      Cookies.set('refresh_token', refresh);
      setUser(userData);
      
      console.log('🔐 AuthContext: Login completed successfully');
      return { success: true };
    } catch (error: any) {
      console.group('🚨 AuthContext: Login Error');
      console.log('Error object:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error response:', error.response);
      console.log('Error request:', error.request);
      console.log('Error config:', error.config);
      console.groupEnd();
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'ログインに失敗しました';
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
