import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, handleApiError } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (accessToken && userData) {
      try {
        // Vérifier si le token est encore valide en récupérant les infos utilisateur
        const response = await authService.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        console.error('Token invalide:', error);
        // Token invalide, nettoyer le localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { user: userData, access, refresh } = response.data;
      
      // Stocker les tokens et données utilisateur
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      const errorInfo = handleApiError(error);
      return { 
        success: false, 
        error: errorInfo.message 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user: newUser, access, refresh } = response.data;
      
      // Stocker les tokens et données utilisateur après inscription
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      const errorInfo = handleApiError(error);
      return { 
        success: false, 
        error: errorInfo.message,
        details: errorInfo.details 
      };
    }
  };

  const resetPassword = async (passwordData) => {
    try {
      await authService.resetPassword(passwordData);
      return { success: true };
    } catch (error) {
      console.error('Erreur de changement de mot de passe:', error);
      const errorInfo = handleApiError(error);
      return { 
        success: false, 
        error: errorInfo.message 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage dans tous les cas
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    resetPassword,
    logout,
    updateUser,
    isEnseignant: user?.user_type === 'enseignant',
    isEtudiant: user?.user_type === 'etudiant',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};