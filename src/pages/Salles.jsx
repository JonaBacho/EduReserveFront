// src/pages/Salles.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Monitor, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Loader,
  AlertCircle,
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  salleService, 
  handleApiError 
} from '../services/api';

const Salles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSalle, setEditingSalle] = useState(null);
  const [viewingSalle, setViewingSalle] = useState(null);
  const { isEnseignant } = useAuth();
  
  const queryClient = useQueryClient();

  // Récupérer les salles
  const { data: salles, isLoading, error, refetch } = useQuery(
    'salles',
    () => salleService.getSalles(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des salles:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour créer une salle
  const createSalleMutation = useMutation(
    salleService.createSalle,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('salles');
        toast.success('Salle créée avec succès');
        setShowCreateModal(false);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour modifier une salle
  const updateSalleMutation = useMutation(
    ({ id, data }) => salleService.updateSalle(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('salles');
        toast.success('Salle modifiée avec succès');
        setEditingSalle(null);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour supprimer une salle
  const deleteSalleMutation = useMutation(
    salleService.deleteSalle,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('salles');
        toast.success('Salle supprimée avec succès');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const handleDelete = (salle) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la salle "${salle.nom}" ?`)) {
      deleteSalleMutation.mutate(salle.id);
    }
  };

  // Filtrer les salles
  const getFilteredSalles = () => {
    if (!salles) return [];
    
    let filtered = salles.filter(salle =>
      salle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salle.equipements?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (capacityFilter !== 'all') {
      const [min, max] = capacityFilter.split('-').map(Number);
      filtered = filtered.filter(salle => {
        if (max) {
          return salle.capacite >= min && salle.capacite <= max;
        } else {
          return salle.capacite >= min;
        }
      });
    }

    return filtered;
  };

  const filteredSalles = getFilteredSalles();

  // Statistiques
  const getStats = () => {
    if (!salles) return { total: 0, petites: 0, moyennes: 0, grandes: 0, totalCapacite: 0 };
    
    return {
      total: salles.length,
      petites: salles.filter(s => s.capacite <= 20).length,
      moyennes: salles.filter(s => s.capacite > 20 && s.capacite <= 40).length,
      grandes: salles.filter(s => s.capacite > 40).length,
      totalCapacite: salles.reduce((sum, s) => sum + s.capacite, 0)
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Chargement des salles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">Erreur lors du chargement des salles</span>
        <button 
          onClick={() => refetch()}
          className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Salles</h1>
            <p className="text-gray-600">
              Consultez et gérez les salles de cours disponibles
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {isEnseignant && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle salle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Nom de salle ou équipements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacité
            </label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les capacités</option>
              <option value="1-20">Petites (1-20 places)</option>
              <option value="21-40">Moyennes (21-40 places)</option>
              <option value="41">Grandes (40+ places)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total salles</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Capacité totale</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCapacite}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Search className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Résultats</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredSalles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Capacité moy.</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total > 0 ? Math.round(stats.totalCapacite / stats.total) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des salles */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des salles
            {searchTerm && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - {filteredSalles.length} résultat(s) pour "{searchTerm}"
              </span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {filteredSalles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalles.map((salle) => (
                <SalleCard
                  key={salle.id}
                  salle={salle}
                  onEdit={isEnseignant ? setEditingSalle : null}
                  onDelete={isEnseignant ? handleDelete : null}
                  onView={setViewingSalle}
                  isDeleting={deleteSalleMutation.isLoading}
                />
              ))}
            </div>
          ) : (
            <EmptyState searchTerm={searchTerm} capacityFilter={capacityFilter} />
          )}
        </div>
      </div>

      {/* Modal de création/modification */}
      {(showCreateModal || editingSalle) && (
        <SalleModal
          salle={editingSalle}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSalle(null);
          }}
          onSubmit={editingSalle ? updateSalleMutation : createSalleMutation}
          isLoading={createSalleMutation.isLoading || updateSalleMutation.isLoading}
        />
      )}

      {/* Modal de vue détaillée */}
      {viewingSalle && (
        <SalleDetailModal
          salle={viewingSalle}
          onClose={() => setViewingSalle(null)}
        />
      )}
    </div>
  );
};

const SalleCard = ({ salle, onEdit, onDelete, onView, isDeleting }) => {
  const getCapacityColor = (capacite) => {
    if (capacite <= 20) return 'text-green-600 bg-green-50';
    if (capacite <= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getCapacityLabel = (capacite) => {
    if (capacite <= 20) return 'Petite';
    if (capacite <= 40) return 'Moyenne';
    return 'Grande';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{salle.nom}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCapacityColor(salle.capacite)}`}>
              {getCapacityLabel(salle.capacite)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(salle)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {onEdit && (
            <button
              onClick={() => onEdit(salle)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(salle)}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              {isDeleting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Capacité</span>
          <span className="text-sm font-medium text-gray-900">{salle.capacite} places</span>
        </div>
        
        {salle.equipements && (
          <div>
            <span className="text-sm text-gray-500">Équipements</span>
            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
              {salle.equipements}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            salle.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {salle.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

const SalleModal = ({ salle, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    nom: salle?.nom || '',
    capacite: salle?.capacite || '',
    equipements: salle?.equipements || '',
    active: salle?.active !== undefined ? salle.active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      nom: formData.nom,
      capacite: parseInt(formData.capacite),
      equipements: formData.equipements,
      active: formData.active
    };

    if (salle) {
      onSubmit.mutate({ id: salle.id, data });
    } else {
      onSubmit.mutate(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {salle ? 'Modifier la salle' : 'Nouvelle salle'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la salle *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacite}
                    onChange={(e) => setFormData({...formData, capacite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Équipements
                  </label>
                  <textarea
                    value={formData.equipements}
                    onChange={(e) => setFormData({...formData, equipements: e.target.value})}
                    rows={3}
                    placeholder="Ex: Tableau blanc, vidéoprojecteur, système audio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Salle active</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  salle ? 'Modifier' : 'Créer'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SalleDetailModal = ({ salle, onClose }) => {
  const { data: planningSalle } = useQuery(
    ['planning-salle', salle.id],
    () => salleService.getPlanningSalle(salle.id),
    {
      select: (response) => response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement du planning:', error);
      }
    }
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Détails de la salle {salle.nom}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom:</span>
                    <span className="font-medium">{salle.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacité:</span>
                    <span className="font-medium">{salle.capacite} places</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut:</span>
                    <span className={`font-medium ${salle.active ? 'text-green-600' : 'text-red-600'}`}>
                      {salle.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Planning récent</h4>
                {planningSalle?.reservations?.length > 0 ? (
                  <div className="space-y-2">
                    {planningSalle.reservations.slice(0, 3).map((reservation, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-gray-500">
                          {reservation.date} - {reservation.creneau_detail?.nom}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune réservation récente</p>
                )}
              </div>
            </div>
            
            {salle.equipements && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Équipements disponibles</h4>
                <p className="text-gray-700 text-sm">{salle.equipements}</p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ searchTerm, capacityFilter }) => {
  return (
    <div className="text-center py-12">
      <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm || capacityFilter !== 'all' ? 'Aucune salle trouvée' : 'Aucune salle disponible'}
      </h3>
      <p className="text-gray-500 mb-6">
        {searchTerm || capacityFilter !== 'all'
          ? 'Aucune salle ne correspond aux critères de recherche'
          : 'Il n\'y a pas encore de salles créées.'
        }
      </p>
    </div>
  );
};

export default Salles;