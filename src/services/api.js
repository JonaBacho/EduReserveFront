// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://fultang.ddns.net:8011/api/v1';

// Configuration d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fonction utilitaire pour gérer les erreurs
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 400) {
      return {
        message: data.detail || data.message || 'Données invalides',
        details: data
      };
    } else if (status === 401) {
      return {
        message: 'Session expirée, veuillez vous reconnecter',
        details: data
      };
    } else if (status === 403) {
      return {
        message: 'Accès non autorisé',
        details: data
      };
    } else if (status === 404) {
      return {
        message: 'Ressource non trouvée',
        details: data
      };
    } else if (status === 500) {
      return {
        message: 'Erreur serveur, veuillez réessayer plus tard',
        details: data
      };
    }
    
    // Correction : Gestion des erreurs de validation Django
    if (status === 422 || (status === 400 && data.errors)) {
      return {
        message: 'Erreur de validation',
        details: data.errors || data
      };
    }
    
    return {
      message: data.detail || data.message || 'Une erreur est survenue',
      details: data
    };
  } else if (error.request) {
    return {
      message: 'Problème de connexion au serveur',
      details: null
    };
  }
  
  return {
    message: 'Une erreur inattendue est survenue',
    details: null
  };
};

// Services d'authentification
export const authService = {
  login: async (credentials) => {
    const loginData = {
      identifier: credentials.identifier, 
      password: credentials.password
    };
    const response = await api.post('/login/', loginData);
    return response;
  },
  
  register: async (userData) => {
    const response = await api.post('/register/', userData);
    return response;
  },
  
  resetPassword: async (data) => {
    const response = await api.post('/reset-password/', data);
    return response;
  },
  
  getProfile: async () => {
    const response = await api.get('/me/');
    return response;
  }
};

// Services des utilisateurs
export const userService = {
  getUsers: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/users/', { params: cleanParams });
    return response;
  },
  
  getUser: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response;
  }
};


// Services des salles
export const salleService = {
  getSalles: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/salles/', { params: cleanParams });
    return response;
  },
  
  getSalle: async (id) => {
    const response = await api.get(`/salles/${id}/`);
    return response;
  },
  
  createSalle: async (data) => {
    const response = await api.post('/salles/', data);
    return response;
  },
  
  updateSalle: async (id, data) => {
    const response = await api.put(`/salles/${id}/`, data);
    return response;
  },
  
  deleteSalle: async (id) => {
    const response = await api.delete(`/salles/${id}/`);
    return response;
  },
  
  getPlanningSalle: async (id, params = {}) => {
    const response = await api.get(`/salles/${id}/planning/`, { params });
    return response;
  }
};

// Services des matériels
export const materielService = {
  getMateriels: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/materiels/', { params: cleanParams });
    return response;
  },
  
  getMateriel: async (id) => {
    // Correction : Garder '/api'
    const response = await api.get(`/materiels/${id}/`);
    return response;
  },
  
  createMateriel: async (data) => {
    // Correction : Garder '/api'
    const response = await api.post('/materiels/', data);
    return response;
  },
  
  updateMateriel: async (id, data) => {
    // Correction : Garder '/api'
    const response = await api.put(`/materiels/${id}/`, data);
    return response;
  },
  
  deleteMateriel: async (id) => {
    // Correction : Garder '/api'
    const response = await api.delete(`/materiels/${id}/`);
    return response;
  },
  
  getPlanningMateriel: async (id, params = {}) => {
    // Correction : Garder '/api'
    const response = await api.get(`/materiels/${id}/planning/`, { params });
    return response;
  }
};

// Services des types de matériel
export const typeMaterielService = {
  getTypesMateriels: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/types-materiel/', { params: cleanParams });
    return response;
  },
  
  createTypeMateriel: async (data) => {
    const response = await api.post('/types-materiel/', data);
    return response;
  }
};

// Services des formations
export const formationService = {
  getFormations: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/formations/', { params: cleanParams });
    return response;
  },
  
  getFormation: async (id) => {
    const response = await api.get(`/formations/${id}/`);
    return response;
  },
  
  createFormation: async (data) => {
    const response = await api.post('/formations/', data);
    return response;
  },
  
  updateFormation: async (id, data) => {
    const response = await api.put(`/formations/${id}/`, data);
    return response;
  },
  
  deleteFormation: async (id) => {
    const response = await api.delete(`/formations/${id}/`);
    return response;
  }
};

// Services des créneaux
export const creneauService = {
  getCreneaux: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/creneaux/', { params: cleanParams });
    return response;
  }
};

// Services des réservations
export const reservationService = {
  // Réservations de salles
  getReservationsSalles: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/reservations-salles/', { params: cleanParams });
    return response;
  },
  
  createReservationSalle: async (data) => {
    const response = await api.post('/reservations-salles/', data);
    return response;
  },
  
  updateReservationSalle: async (id, data) => {
    const response = await api.put(`/reservations-salles/${id}/`, data);
    return response;
  },
  
  deleteReservationSalle: async (id) => {
    const response = await api.delete(`/reservations-salles/${id}/`);
    return response;
  },
  
  // Réservations de matériels
  getReservationsMateriels: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/reservations-materiels/', { params: cleanParams });
    return response;
  },
  
  createReservationMateriel: async (data) => {
    const response = await api.post('/reservations-materiels/', data);
    return response;
  },
  
  updateReservationMateriel: async (id, data) => {
    const response = await api.put(`/reservations-materiels/${id}/`, data);
    return response;
  },
  
  deleteReservationMateriel: async (id) => {
    const response = await api.delete(`/reservations-materiels/${id}/`);
    return response;
  },
  
  // Mes réservations
  getMesReservations: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/mes-reservations/', { params: cleanParams });
    return response;
  }
};

// Services du planning
export const planningService = {
  getPlanningGeneral: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/planning/', { params: cleanParams });
    return response;
  },
  
  checkDisponibilite: async (data) => {
    const response = await api.post('/disponibilite/', data);
    return response;
  }
};

// Services des statistiques
export const statistiquesService = {
  getStatistiques: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/statistiques/', { params: cleanParams });
    return response;
  }
};

export default api;