import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (!parsedUser.id) {
            parsedUser.id = parsedUser.userId || (parsedUser.username === 'admin' ? 1 : 1);
            localStorage.setItem('user', JSON.stringify(parsedUser));
          }
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error al inicializar sesión desde localStorage", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const loginUser = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.login(username, password);
      
      if (response && response.success) {
        const resolvedId = response.userId ?? response.id;
        const userData = {
          id: resolvedId,
          userId: resolvedId,
          username: response.username,
          role: response.role,
          fullName: response.fullName,
          email: response.email,
          profileImageUrl: response.profileImageUrl || ''
        };
        
        setUser(userData);
        setToken(response.token);
        setIsAuthenticated(true);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
      } else {
        return { success: false, message: response?.message || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error("Error de login:", error);
      return { success: false, message: error.message || 'Error de conexión con el servidor' };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfileImage = async (url) => {
    if (!user) return false;
    try {
      await api.actualizarFotoPerfil(user.id, url);
      const updatedUser = { ...user, profileImageUrl: url };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error("Error al actualizar la foto de perfil en el contexto:", error);
      return false;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login: loginUser,
    logout: logoutUser,
    updateProfileImage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
