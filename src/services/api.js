import axios from 'axios';

// Configuration de base pour l'API
export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/token/refresh/', {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token invalide, redirection vers login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // Pas de refresh token, redirection vers login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: (credentials) => api.post('/login/', {
    identifier: credentials.username || credentials.identifier,
    password: credentials.password
  }),
  register: (userData) => api.post('/register/', userData),
  resetPassword: (passwordData) => api.post('/reset-password/', passwordData),
  getCurrentUser: () => api.get('/me/'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

// Services utilisateurs
export const userService = {
  getUsers: (params) => api.get('/api/users/', { params }),
  getUser: (id) => api.get(`/api/users/${id}/`),
};

// Services formations
export const formationService = {
  getFormations: (params) => api.get('/api/formations/', { params }),
  getFormation: (id) => api.get(`/api/formations/${id}/`),
  createFormation: (data) => api.post('/api/formations/', data),
  updateFormation: (id, data) => api.put(`/api/formations/${id}/`, data),
  partialUpdateFormation: (id, data) => api.patch(`/api/formations/${id}/`, data),
  deleteFormation: (id) => api.delete(`/api/formations/${id}/`),
};

// Services salles
export const salleService = {
  getSalles: (params) => api.get('/api/salles/', { params }),
  getSalle: (id) => api.get(`/api/salles/${id}/`),
  createSalle: (data) => api.post('/api/salles/', data),
  updateSalle: (id, data) => api.put(`/api/salles/${id}/`, data),
  partialUpdateSalle: (id, data) => api.patch(`/api/salles/${id}/`, data),
  deleteSalle: (id) => api.delete(`/api/salles/${id}/`),
  getPlanningSalle: (id, params) => api.get(`/api/salles/${id}/planning/`, { params }),
};

// Services matériels
export const materielService = {
  getMateriels: (params) => api.get('/api/materiels/', { params }),
  getMateriel: (id) => api.get(`/api/materiels/${id}/`),
  createMateriel: (data) => api.post('/api/materiels/', data),
  updateMateriel: (id, data) => api.put(`/api/materiels/${id}/`, data),
  partialUpdateMateriel: (id, data) => api.patch(`/api/materiels/${id}/`, data),
  deleteMateriel: (id) => api.delete(`/api/materiels/${id}/`),
  getPlanningMateriel: (id, params) => api.get(`/api/materiels/${id}/planning/`, { params }),
};

// Services types de matériel
export const typeMaterielService = {
  getTypesMateriels: (params) => api.get('/api/types-materiel/', { params }),
  getTypeMateriel: (id) => api.get(`/api/types-materiel/${id}/`),
  createTypeMateriel: (data) => api.post('/api/types-materiel/', data),
  updateTypeMateriel: (id, data) => api.put(`/api/types-materiel/${id}/`, data),
  partialUpdateTypeMateriel: (id, data) => api.patch(`/api/types-materiel/${id}/`, data),
  deleteTypeMateriel: (id) => api.delete(`/api/types-materiel/${id}/`),
};

// Services créneaux
export const creneauService = {
  getCreneaux: () => api.get('/api/creneaux/'),
  getCreneau: (id) => api.get(`/api/creneaux/${id}/`),
};

// Services réservations
export const reservationService = {
  // Réservations de salles
  getReservationsSalles: (params) => api.get('/api/reservations-salles/', { params }),
  getReservationSalle: (id) => api.get(`/api/reservations-salles/${id}/`),
  createReservationSalle: (data) => api.post('/api/reservations-salles/', data),
  updateReservationSalle: (id, data) => api.put(`/api/reservations-salles/${id}/`, data),
  partialUpdateReservationSalle: (id, data) => api.patch(`/api/reservations-salles/${id}/`, data),
  deleteReservationSalle: (id) => api.delete(`/api/reservations-salles/${id}/`),
  
  // Réservations de matériels
  getReservationsMateriels: (params) => api.get('/api/reservations-materiels/', { params }),
  getReservationMateriel: (id) => api.get(`/api/reservations-materiels/${id}/`),
  createReservationMateriel: (data) => api.post('/api/reservations-materiels/', data),
  updateReservationMateriel: (id, data) => api.put(`/api/reservations-materiels/${id}/`, data),
  partialUpdateReservationMateriel: (id, data) => api.patch(`/api/reservations-materiels/${id}/`, data),
  deleteReservationMateriel: (id) => api.delete(`/api/reservations-materiels/${id}/`),
  
  // Services spéciaux
  getMesReservations: (params) => api.get('/mes-reservations/', { params }),
};

// Services récapitulatifs
export const recapitulatifService = {
  getRecapitulatifs: (params) => api.get('/api/recapitulatifs/', { params }),
  getRecapitulatif: (id) => api.get(`/api/recapitulatifs/${id}/`),
  createRecapitulatif: (data) => api.post('/api/recapitulatifs/', data),
  updateRecapitulatif: (id, data) => api.put(`/api/recapitulatifs/${id}/`, data),
  partialUpdateRecapitulatif: (id, data) => api.patch(`/api/recapitulatifs/${id}/`, data),
  deleteRecapitulatif: (id) => api.delete(`/api/recapitulatifs/${id}/`),
};

// Services planning et disponibilité
export const planningService = {
  getPlanningGeneral: (params) => api.get('/planning/', { params }),
  getPlanningEnseignant: (enseignantId, params) => 
    api.get(`/planning-enseignant/${enseignantId}/`, { params }),
  checkDisponibilite: (data) => api.post('/disponibilite/', data),
};

// Services statistiques
export const statistiquesService = {
  getStatistiques: () => api.get('/statistiques/'),
};

// Utilitaires pour gestion des erreurs
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response?.data) {
    const errorData = error.response.data;
    
    // Erreurs de validation
    if (errorData.errors || errorData.non_field_errors) {
      return {
        message: 'Erreur de validation',
        details: errorData.errors || errorData.non_field_errors
      };
    }
    
    // Erreur simple avec message
    if (errorData.detail) {
      return {
        message: errorData.detail
      };
    }
    
    // Message générique basé sur le status
    switch (error.response.status) {
      case 400:
        return { message: 'Données invalides' };
      case 401:
        return { message: 'Non autorisé' };
      case 403:
        return { message: 'Accès interdit' };
      case 404:
        return { message: 'Ressource non trouvée' };
      case 500:
        return { message: 'Erreur serveur' };
      default:
        return { message: 'Une erreur est survenue' };
    }
  }
  
  return { message: 'Erreur de connexion' };
};

// Helper pour la pagination
export const buildPaginationParams = (page = 1, pageSize = 20, filters = {}) => {
  return {
    page,
    page_size: pageSize,
    ...filters
  };
};