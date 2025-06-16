// src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, handleApiError } from '../services/api';

// État initial
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false
};

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext();

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Vérifier si le token est encore valide
        try {
          const response = await authService.getProfile();
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data }
          });
        } catch (error) {
          // Token invalide, nettoyer le localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authService.login(credentials);
      
      if (response.data && response.data.access) {
        const { access, user } = response.data;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('authToken', access);
        localStorage.setItem('userData', JSON.stringify(user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return { 
          success: false, 
          error: 'Réponse invalide du serveur' 
        };
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      const errorInfo = handleApiError(error);
      
      if (error.response?.status === 401) {
        return { 
          success: false, 
          error: 'Nom d\'utilisateur ou mot de passe incorrect' 
        };
      }
      
      return { 
        success: false, 
        error: errorInfo.message,
        details: errorInfo.details
      };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authService.register(userData);
      
      if (response.data && response.data.access) {
        const { access, user } = response.data;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('authToken', access);
        localStorage.setItem('userData', JSON.stringify(user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return { 
          success: false, 
          error: 'Erreur lors de la création du compte' 
        };
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
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
      const response = await authService.resetPassword(passwordData);
      
      if (response.status === 200) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Erreur lors du changement de mot de passe' 
        };
      }
    } catch (error) {
      const errorInfo = handleApiError(error);
      
      if (error.response?.status === 400) {
        return { 
          success: false, 
          error: 'Mot de passe actuel incorrect' 
        };
      }
      
      return { 
        success: false, 
        error: errorInfo.message 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateUser = (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  // Fonctions utilitaires
  const isEnseignant = state.user?.user_type === 'enseignant';
  const isEtudiant = state.user?.user_type === 'etudiant';

  const value = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    isEnseignant,
    isEtudiant,
    login,
    register,
    logout,
    resetPassword,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;