import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fmvz_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Sesión expirada');
        })
        .then(data => {
          setAdmin(data.admin);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
      localStorage.setItem('fmvz_admin_token', data.token);
      setToken(data.token);
      setAdmin(data.admin);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('fmvz_admin_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
