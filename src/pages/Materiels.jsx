// src/pages/Materiels.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Loader,
  AlertCircle,
  Package,
  Calendar,
  Eye,
  Tag,
  RefreshCw,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  materielService, 
  typeMaterielService,
  handleApiError 
} from '../services/api';
import LoadingSpinner, { CardLoader } from '../components/LoadingSpinner';

const Materiels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState(null);
  const [viewingMateriel, setViewingMateriel] = useState(null);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isEnseignant } = useAuth();
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();

  // Récupérer les matériels
  const { data: materiels, isLoading, error, refetch } = useQuery(
    'materiels',
    () => materielService.getMateriels(),
    {
      select: (response) => response.data.results || response.data,
      retry: 2,
      onError: (error) => {
        console.error('Erreur lors du chargement des matériels:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Récupérer les types de matériel
  const { data: typesMateriels } = useQuery(
    'types-materiels',
    () => typeMaterielService.getTypesMateriels(),
    {
      select: (response) => response.data.results || response.data,
      retry: 2,
    }
  );

  // Mutations pour les matériels
  const createMaterielMutation = useMutation(
    materielService.createMateriel,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('materiels');
        toast.success('Matériel créé avec succès');
        setShowCreateModal(false);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const updateMaterielMutation = useMutation(
    ({ id, data }) => materielService.updateMateriel(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('materiels');
        toast.success('Matériel modifié avec succès');
        setEditingMateriel(null);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const deleteMaterielMutation = useMutation(
    materielService.deleteMateriel,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('materiels');
        toast.success('Matériel supprimé avec succès');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutations pour les types de matériel
  const createTypeMaterielMutation = useMutation(
    typeMaterielService.createTypeMateriel,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('types-materiels');
        toast.success('Type de matériel créé avec succès');
        setShowCreateTypeModal(false);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const handleDelete = (materiel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le matériel "${materiel.nom}" ?`)) {
      deleteMaterielMutation.mutate(materiel.id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Liste actualisée');
  };

  // Filtrer les matériels
  const getFilteredMateriels = () => {
    if (!materiels) return [];
    
    let filtered = materiels.filter(materiel =>
      materiel.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materiel.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materiel.type_materiel_detail?.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (typeFilter !== 'all') {
      filtered = filtered.filter(materiel => 
        materiel.type_materiel === parseInt(typeFilter)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(materiel => 
        statusFilter === 'active' ? materiel.active : !materiel.active
      );
    }

    return filtered;
  };

  const filteredMateriels = getFilteredMateriels();

  // Statistiques
  const getStats = () => {
    if (!materiels) return { total: 0, actifs: 0, inactifs: 0, types: 0 };
    
    return {
      total: materiels.length,
      actifs: materiels.filter(m => m.active).length,
      inactifs: materiels.filter(m => !m.active).length,
      types: typesMateriels?.length || 0
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="skeleton-text w-64 h-8 mb-2"></div>
          <div className="skeleton-text w-96 h-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-soft p-6">
              <div className="skeleton-text w-20 h-4 mb-2"></div>
              <div className="skeleton-text w-12 h-8"></div>
            </div>
          ))}
        </div>
        <CardLoader count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">
            Impossible de charger la liste des matériels.
          </p>
          <div className="space-x-4">
            <button onClick={handleRefresh} className="btn-primary">
              Réessayer
            </button>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Matériels</h1>
              <p className="text-gray-600">
                Consultez et gérez le matériel pédagogique disponible
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {isEnseignant && (
              <>
                <button
                  onClick={() => setShowCreateTypeModal(true)}
                  className="flex items-center space-x-2 border border-primary-600 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span>Nouveau type</span>
                </button>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau matériel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Nom, numéro de série ou type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de matériel
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="all">Tous les types</option>
                  {typesMateriels?.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.nom}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Disponibles uniquement</option>
                  <option value="inactive">Indisponibles uniquement</option>
                </select>
              </div>
            </div>

            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total matériels"
          value={stats.total}
          icon={Package}
          color="blue"
        />
        
        <StatCard
          title="Disponibles"
          value={stats.actifs}
          icon={Laptop}
          color="green"
        />
        
        <StatCard
          title="Indisponibles"
          value={stats.inactifs}
          icon={AlertCircle}
          color="red"
        />
        
        <StatCard
          title="Types"
          value={stats.types}
          icon={Tag}
          color="purple"
        />
      </div>

      {/* Liste des matériels */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des matériels
              {searchTerm && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - {filteredMateriels.length} résultat(s) pour "{searchTerm}"
                </span>
              )}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredMateriels.length} matériel{filteredMateriels.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {filteredMateriels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMateriels.map((materiel) => (
                <MaterielCard
                  key={materiel.id}
                  materiel={materiel}
                  onEdit={isEnseignant ? setEditingMateriel : null}
                  onDelete={isEnseignant ? handleDelete : null}
                  onView={setViewingMateriel}
                  isDeleting={deleteMaterielMutation.isLoading}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              searchTerm={searchTerm} 
              typeFilter={typeFilter} 
              statusFilter={statusFilter} 
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {(showCreateModal || editingMateriel) && (
        <MaterielModal
          materiel={editingMateriel}
          typesMateriels={typesMateriels}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMateriel(null);
          }}
          onSubmit={editingMateriel ? updateMaterielMutation : createMaterielMutation}
          isLoading={createMaterielMutation.isLoading || updateMaterielMutation.isLoading}
        />
      )}

      {showCreateTypeModal && (
        <TypeMaterielModal
          onClose={() => setShowCreateTypeModal(false)}
          onSubmit={createTypeMaterielMutation}
          isLoading={createTypeMaterielMutation.isLoading}
        />
      )}

      {viewingMateriel && (
        <MaterielDetailModal
          materiel={viewingMateriel}
          onClose={() => setViewingMateriel(null)}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const MaterielCard = ({ materiel, onEdit, onDelete, onView, isDeleting }) => {
  const getTypeColor = (type) => {
    const colors = {
      'Ordinateur portable': 'text-blue-600 bg-blue-50',
      'Vidéoprojecteur': 'text-green-600 bg-green-50',
      'Tablette': 'text-purple-600 bg-purple-50',
      'Micro-ordinateur': 'text-orange-600 bg-orange-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${getTypeColor(materiel.type_materiel_detail?.nom)}`}>
            <Laptop className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{materiel.nom}</h3>
            {materiel.type_materiel_detail && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(materiel.type_materiel_detail.nom)}`}>
                {materiel.type_materiel_detail.nom}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(materiel)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {onEdit && (
            <button
              onClick={() => onEdit(materiel)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(materiel)}
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
        {materiel.numero_serie && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">N° série</span>
            <span className="text-sm font-mono text-gray-900">{materiel.numero_serie}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            materiel.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {materiel.active ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>
    </div>
  );
};

const MaterielModal = ({ materiel, typesMateriels, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    nom: materiel?.nom || '',
    type_materiel: materiel?.type_materiel || '',
    numero_serie: materiel?.numero_serie || '',
    active: materiel?.active !== undefined ? materiel.active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom du matériel est requis');
      return;
    }

    if (!formData.type_materiel) {
      toast.error('Le type de matériel est requis');
      return;
    }
    
    const data = {
      nom: formData.nom.trim(),
      type_materiel: parseInt(formData.type_materiel),
      numero_serie: formData.numero_serie.trim() || null,
      active: formData.active
    };

    if (materiel) {
      onSubmit.mutate({ id: materiel.id, data });
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
                  {materiel ? 'Modifier le matériel' : 'Nouveau matériel'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du matériel *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="form-input"
                    placeholder="Ex: MacBook Pro 13, Projecteur Epson..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de matériel *
                  </label>
                  <select
                    value={formData.type_materiel}
                    onChange={(e) => setFormData({...formData, type_materiel: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Sélectionnez un type</option>
                    {typesMateriels?.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de série
                  </label>
                  <input
                    type="text"
                    value={formData.numero_serie}
                    onChange={(e) => setFormData({...formData, numero_serie: e.target.value})}
                    className="form-input"
                    placeholder="Ex: ABC123456789"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Numéro d'identification unique du matériel
                  </p>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Matériel disponible</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Décochez si le matériel est en maintenance ou hors service
                  </p>
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
                  materiel ? 'Modifier' : 'Créer'
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

const TypeMaterielModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom du type est requis');
      return;
    }

    onSubmit.mutate({
      nom: formData.nom.trim(),
      description: formData.description.trim()
    });
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
                  Nouveau type de matériel
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du type *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="form-input"
                    placeholder="Ex: Ordinateur portable, Vidéoprojecteur..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="form-textarea"
                    placeholder="Description optionnelle du type de matériel..."
                  />
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
                  'Créer'
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

const MaterielDetailModal = ({ materiel, onClose }) => {
  const { data: planningMateriel } = useQuery(
    ['planning-materiel', materiel.id],
    () => materielService.getPlanningMateriel(materiel.id),
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
                Détails du matériel: {materiel.nom}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom:</span>
                    <span className="font-medium">{materiel.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{materiel.type_materiel_detail?.nom || 'Non défini'}</span>
                  </div>
                  {materiel.numero_serie && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">N° série:</span>
                      <span className="font-mono text-sm">{materiel.numero_serie}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut:</span>
                    <span className={`font-medium ${materiel.active ? 'text-green-600' : 'text-red-600'}`}>
                      {materiel.active ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Planning récent</h4>
                {planningMateriel?.reservations?.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {planningMateriel.reservations.slice(0, 5).map((reservation, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="font-medium">{reservation.date}</div>
                        <div className="text-gray-600">{reservation.creneau_detail?.nom}</div>
                        <div className="text-gray-500 text-xs">{reservation.formation_detail?.nom}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune réservation récente</p>
                )}
              </div>
            </div>

            {materiel.type_materiel_detail?.description && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Description du type</h4>
                <p className="text-gray-600 text-sm">{materiel.type_materiel_detail.description}</p>
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

const EmptyState = ({ searchTerm, typeFilter, statusFilter }) => {
  const hasFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all';
  
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFilters ? 'Aucun matériel trouvé' : 'Aucun matériel disponible'}
      </h3>
      <p className="text-gray-500 mb-6">
        {hasFilters
          ? 'Aucun matériel ne correspond aux critères de recherche'
          : 'Il n\'y a pas encore de matériel dans la base de données.'
        }
      </p>
      {hasFilters && (
        <button
          onClick={() => {
            setSearchTerm('');
            setTypeFilter('all');
            setStatusFilter('all');
          }}
          className="btn-secondary mr-4"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
};

export default Materiels;