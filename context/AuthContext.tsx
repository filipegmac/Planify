import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';
import { safeStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const [token, setToken] = useState<string | null>(() => {
    try {
      return safeStorage.getItem('token');
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const login = (newToken: string, newUser: User) => {
    try {
      safeStorage.setItem('token', newToken);
    } catch {
      // Falha ao salvar token
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    try {
      safeStorage.removeItem('token');
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};