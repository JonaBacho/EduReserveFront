// src/pages/Formations.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Loader,
  AlertCircle,
  User,
  Calendar,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  formationService, 
  userService,
  handleApiError 
} from '../services/api';

const Formations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFormation, setEditingFormation] = useState(null);
  const { isEnseignant } = useAuth();
  
  const queryClient = useQueryClient();

  // Récupérer les formations
  const { data: formations, isLoading, error, refetch } = useQuery(
    'formations',
    () => formationService.getFormations(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des formations:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Récupérer les enseignants pour le sélecteur de responsable
  const { data: enseignants } = useQuery(
    'enseignants',
    () => userService.getUsers({ user_type: 'enseignant' }),
    {
      select: (response) => response.data.results || response.data,
      enabled: isEnseignant && (showCreateModal || editingFormation),
    }
  );

  // Mutation pour créer une formation
  const createFormationMutation = useMutation(
    formationService.createFormation,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('formations');
        toast.success('Formation créée avec succès');
        setShowCreateModal(false);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour modifier une formation
  const updateFormationMutation = useMutation(
    ({ id, data }) => formationService.updateFormation(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('formations');
        toast.success('Formation modifiée avec succès');
        setEditingFormation(null);
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour supprimer une formation
  const deleteFormationMutation = useMutation(
    formationService.deleteFormation,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('formations');
        toast.success('Formation supprimée avec succès');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const handleDelete = (formation) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la formation "${formation.nom}" ?`)) {
      deleteFormationMutation.mutate(formation.id);
    }
  };

  // Filtrer les formations par recherche
  const filteredFormations = formations?.filter(formation =>
    formation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formation.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Chargement des formations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">Erreur lors du chargement des formations</span>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations</h1>
            <p className="text-gray-600">
              Consultez la liste des formations disponibles
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {isEnseignant && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle formation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total formations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formations?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <User className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avec responsable</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formations?.filter(f => f.responsable_detail).length || 0}
              </p>
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
              <p className="text-2xl font-semibold text-gray-900">
                {filteredFormations.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des formations */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des formations
            {searchTerm && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - {filteredFormations.length} résultat(s) pour "{searchTerm}"
              </span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {filteredFormations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormations.map((formation) => (
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  onEdit={isEnseignant ? setEditingFormation : null}
                  onDelete={isEnseignant ? handleDelete : null}
                  isDeleting={deleteFormationMutation.isLoading}
                />
              ))}
            </div>
          ) : (
            <EmptyState searchTerm={searchTerm} />
          )}
        </div>
      </div>

      {/* Modal de création/modification */}
      {(showCreateModal || editingFormation) && (
        <FormationModal
          formation={editingFormation}
          enseignants={enseignants}
          onClose={() => {
            setShowCreateModal(false);
            setEditingFormation(null);
          }}
          onSubmit={editingFormation ? updateFormationMutation : createFormationMutation}
          isLoading={createFormationMutation.isLoading || updateFormationMutation.isLoading}
        />
      )}
    </div>
  );
};

const FormationCard = ({ formation, onEdit, onDelete, isDeleting }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{formation.nom}</h3>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(formation)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(formation)}
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
        )}
      </div>
      
      {formation.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {formation.description}
        </p>
      )}
      
      <div className="space-y-2">
        {formation.responsable_detail ? (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Responsable: {formation.responsable_detail.first_name} {formation.responsable_detail.last_name}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 italic">
              Aucun responsable assigné
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            Créée le {format(new Date(formation.created_at), 'dd MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>
    </div>
  );
};

const FormationModal = ({ formation, enseignants, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    nom: formation?.nom || '',
    description: formation?.description || '',
    responsable: formation?.responsable || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      nom: formData.nom,
      description: formData.description,
      responsable: formData.responsable || null
    };

    if (formation) {
      onSubmit.mutate({ id: formation.id, data });
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
                  {formation ? 'Modifier la formation' : 'Nouvelle formation'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la formation *
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable
                  </label>
                  <select
                    value={formData.responsable}
                    onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Aucun responsable</option>
                    {enseignants?.map(enseignant => (
                      <option key={enseignant.id} value={enseignant.id}>
                        {enseignant.first_name} {enseignant.last_name}
                      </option>
                    ))}
                  </select>
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
                  formation ? 'Modifier' : 'Créer'
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

const EmptyState = ({ searchTerm }) => {
  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'Aucune formation trouvée' : 'Aucune formation disponible'}
      </h3>
      <p className="text-gray-500 mb-6">
        {searchTerm 
          ? `Aucune formation ne correspond à "${searchTerm}"`
          : 'Il n\'y a pas encore de formations créées.'
        }
      </p>
    </div>
  );
};

export default Formations;