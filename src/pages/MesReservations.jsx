// src/pages/MesReservations.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Monitor, 
  Laptop, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Loader,
  AlertCircle,
  Clock,
  User,
  Building
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  reservationService, 
  handleApiError 
} from '../services/api';

const MesReservations = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'salles', 'materiels'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'upcoming', 'today', 'past'
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();

  // Récupérer toutes les réservations de l'utilisateur
  const { data: mesReservations, isLoading, error, refetch } = useQuery(
    'mes-reservations-detailed',
    () => reservationService.getMesReservations(),
    {
      select: (response) => response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des réservations:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour supprimer une réservation de salle
  const deleteReservationSalleMutation = useMutation(
    reservationService.deleteReservationSalle,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('mes-reservations');
        queryClient.invalidateQueries('mes-reservations-detailed');
        toast.success('Réservation de salle supprimée avec succès');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Mutation pour supprimer une réservation de matériel
  const deleteReservationMaterielMutation = useMutation(
    reservationService.deleteReservationMateriel,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('mes-reservations');
        queryClient.invalidateQueries('mes-reservations-detailed');
        toast.success('Réservation de matériel supprimée avec succès');
      },
      onError: (error) => {
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  const handleDelete = (reservation, type) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette réservation ?`)) {
      if (type === 'salle') {
        deleteReservationSalleMutation.mutate(reservation.id);
      } else {
        deleteReservationMaterielMutation.mutate(reservation.id);
      }
    }
  };

  // Filtrer les réservations
  const getFilteredReservations = () => {
    if (!mesReservations) return { salles: [], materiels: [] };

    let sallesFiltered = mesReservations.reservations_salles || [];
    let materielsFiltered = mesReservations.reservations_materiels || [];

    // Filtrer par date
    const filterByDate = (reservations) => {
      switch (dateFilter) {
        case 'today':
          return reservations.filter(res => isToday(new Date(res.date)));
        case 'upcoming':
          return reservations.filter(res => !isPast(new Date(res.date)));
        case 'past':
          return reservations.filter(res => isPast(new Date(res.date)));
        default:
          return reservations;
      }
    };

    sallesFiltered = filterByDate(sallesFiltered);
    materielsFiltered = filterByDate(materielsFiltered);

    return { salles: sallesFiltered, materiels: materielsFiltered };
  };

  const { salles, materiels } = getFilteredReservations();

  // Données à afficher selon l'onglet actif
  const getDisplayData = () => {
    switch (activeTab) {
      case 'salles':
        return salles.map(res => ({ ...res, type: 'salle' }));
      case 'materiels':
        return materiels.map(res => ({ ...res, type: 'materiel' }));
      default:
        return [
          ...salles.map(res => ({ ...res, type: 'salle' })),
          ...materiels.map(res => ({ ...res, type: 'materiel' }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  };

  const displayData = getDisplayData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Chargement de vos réservations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">Erreur lors du chargement des réservations</span>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes réservations</h1>
            <p className="text-gray-600">
              Gérez vos réservations de salles et de matériel
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
            
            <Link
              to="/reservations"
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle réservation</span>
            </Link>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de réservation
                </label>
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Toutes les réservations</option>
                  <option value="salles">Salles uniquement</option>
                  <option value="materiels">Matériels uniquement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="upcoming">À venir</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="past">Passées</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Réservations salles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mesReservations?.reservations_salles?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Réservations matériels</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mesReservations?.reservations_materiels?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(mesReservations?.reservations_salles?.length || 0) + 
                 (mesReservations?.reservations_materiels?.length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'all' ? 'Toutes mes réservations' : 
             activeTab === 'salles' ? 'Mes réservations de salles' : 
             'Mes réservations de matériels'}
            {dateFilter !== 'all' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({dateFilter === 'upcoming' ? 'À venir' : 
                  dateFilter === 'today' ? 'Aujourd\'hui' : 
                  dateFilter === 'past' ? 'Passées' : ''})
              </span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {displayData.length > 0 ? (
            <div className="space-y-4">
              {displayData.map((reservation) => (
                <ReservationCard
                  key={`${reservation.type}-${reservation.id}`}
                  reservation={reservation}
                  onDelete={handleDelete}
                  isDeleting={
                    reservation.type === 'salle' 
                      ? deleteReservationSalleMutation.isLoading
                      : deleteReservationMaterielMutation.isLoading
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState activeTab={activeTab} dateFilter={dateFilter} />
          )}
        </div>
      </div>
    </div>
  );
};

const ReservationCard = ({ reservation, onDelete, isDeleting }) => {
  const getDateLabel = (date) => {
    const reservationDate = new Date(date);
    if (isToday(reservationDate)) return 'Aujourd\'hui';
    if (isTomorrow(reservationDate)) return 'Demain';
    return format(reservationDate, 'EEEE dd MMMM', { locale: fr });
  };

  const getDateColor = (date) => {
    const reservationDate = new Date(date);
    if (isPast(reservationDate)) return 'text-gray-500';
    if (isToday(reservationDate)) return 'text-green-600 font-semibold';
    if (isTomorrow(reservationDate)) return 'text-orange-600 font-semibold';
    return 'text-gray-700';
  };

  const getTypeIcon = (type) => {
    return type === 'salle' ? Monitor : Laptop;
  };

  const getTypeColor = (type) => {
    return type === 'salle' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const TypeIcon = getTypeIcon(reservation.type);
  const canEdit = !isPast(new Date(reservation.date));
  const canDelete = !isPast(new Date(reservation.date));

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Icône et type */}
          <div className={`p-2 rounded-lg ${getTypeColor(reservation.type)}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          
          {/* Informations principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {reservation.type === 'salle' 
                    ? reservation.sujet || 'Réservation de salle'
                    : `Réservation de ${reservation.materiel_detail?.nom || 'matériel'}`
                  }
                </h3>
                
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ressource */}
                  <div className="flex items-center space-x-2">
                    {reservation.type === 'salle' ? (
                      <Building className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Monitor className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      {reservation.type === 'salle' 
                        ? reservation.salle_detail?.nom
                        : reservation.materiel_detail?.nom
                      }
                    </span>
                    {reservation.type === 'salle' && reservation.salle_detail?.capacite && (
                      <span className="text-xs text-gray-500">
                        (Cap. {reservation.salle_detail.capacite})
                      </span>
                    )}
                  </div>
                  
                  {/* Formation */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {reservation.formation_detail?.nom}
                    </span>
                  </div>
                  
                  {/* Date et créneau */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${getDateColor(reservation.date)}`}>
                      {getDateLabel(reservation.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {reservation.creneau_detail?.nom}
                    </span>
                  </div>
                </div>
                
                {/* Commentaires */}
                {reservation.commentaires && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Commentaires:</span> {reservation.commentaires}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {canEdit && (
            <button
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Modifier"
              onClick={() => {
                // TODO: Implémenter la modification
                toast.info('Fonctionnalité de modification en cours de développement');
              }}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {canDelete && (
            <button
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Supprimer"
              disabled={isDeleting}
              onClick={() => onDelete(reservation, reservation.type)}
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
      
      {/* Statut */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isPast(new Date(reservation.date))
              ? 'bg-gray-100 text-gray-800'
              : isToday(new Date(reservation.date))
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isPast(new Date(reservation.date)) ? 'Terminée' : 
             isToday(new Date(reservation.date)) ? 'En cours' : 'Planifiée'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          Créé le {format(new Date(reservation.created_at), 'dd/MM/yyyy à HH:mm')}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ activeTab, dateFilter }) => {
  const getEmptyMessage = () => {
    if (dateFilter === 'today') {
      return {
        title: 'Aucune réservation aujourd\'hui',
        description: 'Vous n\'avez pas de réservations prévues pour aujourd\'hui.',
      };
    }
    if (dateFilter === 'upcoming') {
      return {
        title: 'Aucune réservation à venir',
        description: 'Vous n\'avez pas de réservations planifiées.',
      };
    }
    if (dateFilter === 'past') {
      return {
        title: 'Aucune réservation passée',
        description: 'Vous n\'avez pas encore d\'historique de réservations.',
      };
    }
    if (activeTab === 'salles') {
      return {
        title: 'Aucune réservation de salle',
        description: 'Vous n\'avez pas encore réservé de salle.',
      };
    }
    if (activeTab === 'materiels') {
      return {
        title: 'Aucune réservation de matériel',
        description: 'Vous n\'avez pas encore réservé de matériel.',
      };
    }
    return {
      title: 'Aucune réservation',
      description: 'Vous n\'avez pas encore effectué de réservations.',
    };
  };

  const { title, description } = getEmptyMessage();

  return (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      <Link
        to="/reservations"
        className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Créer une réservation</span>
      </Link>
    </div>
  );
};

export default MesReservations;