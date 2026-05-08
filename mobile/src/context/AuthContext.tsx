import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  number: string;
  is_admin: boolean;
  is_private?: boolean;
  profile_picture_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, gender: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const stored = await AsyncStorage.getItem('token');
      if (stored) {
        setToken(stored);
        const res = await api.get('/auth/me');
        setUser(res.data);
      }
    } catch {
      await AsyncStorage.multiRemove(['token', 'gender']);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, gender: string) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('gender', gender);
    setToken(newToken);
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'gender']);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
