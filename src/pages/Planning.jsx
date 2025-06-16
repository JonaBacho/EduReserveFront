import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Calendar, ChevronLeft, ChevronRight, Monitor, User, Clock, Loader, AlertCircle } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  planningService, 
  creneauService, 
  salleService, 
  handleApiError 
} from '../services/api';

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' ou 'week'

  // Charger les créneaux horaires
  const { data: creneaux, isLoading: loadingCreneaux } = useQuery(
    'creneaux',
    () => creneauService.getCreneaux(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des créneaux:', error);
        toast.error('Erreur lors du chargement des créneaux horaires');
      }
    }
  );

  // Charger les salles
  const { data: salles, isLoading: loadingSalles } = useQuery(
    'salles',
    () => salleService.getSalles(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des salles:', error);
        toast.error('Erreur lors du chargement des salles');
      }
    }
  );

  // Charger le planning pour la date sélectionnée
  const { data: planningData, isLoading: loadingPlanning, refetch } = useQuery(
    ['planning', format(selectedDate, 'yyyy-MM-dd')],
    () => planningService.getPlanningGeneral({
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    {
      select: (response) => response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement du planning:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur planning: ${errorInfo.message}`);
      }
    }
  );

  // Charger le planning pour la semaine (mode semaine)
  const weekDates = getWeekDays(selectedDate);
  const { data: weekPlanningData, isLoading: loadingWeekPlanning } = useQuery(
    ['week-planning', weekDates.map(d => format(d, 'yyyy-MM-dd')).join(',')],
    async () => {
      const planningPromises = weekDates.map(date => 
        planningService.getPlanningGeneral({
          date: format(date, 'yyyy-MM-dd')
        }).then(response => ({
          date: format(date, 'yyyy-MM-dd'),
          data: response.data
        }))
      );
      const results = await Promise.all(planningPromises);
      return results.reduce((acc, result) => {
        acc[result.date] = result.data;
        return acc;
      }, {});
    },
    {
      enabled: viewMode === 'week',
      onError: (error) => {
        console.error('Erreur lors du chargement du planning hebdomadaire:', error);
        toast.error('Erreur lors du chargement du planning hebdomadaire');
      }
    }
  );

  const navigateDate = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(viewMode === 'day' ? subDays(selectedDate, 1) : subDays(selectedDate, 7));
    } else {
      setSelectedDate(viewMode === 'day' ? addDays(selectedDate, 1) : addDays(selectedDate, 7));
    }
  };

  const getWeekDays = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Commence le lundi
    return Array.from({ length: 5 }, (_, i) => addDays(start, i)); // Seulement les jours ouvrables
  };

  const getReservationsForDate = (date) => {
    if (!planningData || !planningData.planning) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (dateStr !== planningData.date) return [];
    
    // Extraire toutes les réservations de tous les créneaux
    const allReservations = [];
    Object.values(planningData.planning).forEach(creneauReservations => {
      if (Array.isArray(creneauReservations)) {
        allReservations.push(...creneauReservations);
      }
    });
    
    return allReservations;
  };

  const getReservationForSlot = (date, creneauId) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (viewMode === 'week' && weekPlanningData && weekPlanningData[dateStr]) {
      const dayPlanning = weekPlanningData[dateStr];
      if (dayPlanning.planning) {
        const creneau = creneaux?.find(c => c.id === creneauId);
        if (creneau && dayPlanning.planning[creneau.nom]) {
          return dayPlanning.planning[creneau.nom][0]; // Prendre la première réservation
        }
      }
    } else if (viewMode === 'day' && planningData && isSameDay(new Date(planningData.date), date)) {
      if (planningData.planning) {
        const creneau = creneaux?.find(c => c.id === creneauId);
        if (creneau && planningData.planning[creneau.nom]) {
          return planningData.planning[creneau.nom][0]; // Prendre la première réservation
        }
      }
    }
    
    return null;
  };

  const isLoading = loadingCreneaux || loadingSalles || 
                   (viewMode === 'day' ? loadingPlanning : loadingWeekPlanning);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Chargement du planning...</span>
      </div>
    );
  }

  if (!creneaux || !salles) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">Erreur lors du chargement des données</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Planning des salles</h1>
            <p className="text-gray-600">
              Consultez les réservations de salles et leur disponibilité
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sélecteur de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semaine
              </button>
            </div>

            {/* Navigation des dates */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center min-w-[200px]">
                <p className="font-semibold text-gray-900">
                  {viewMode === 'day'
                    ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })
                    : `Semaine du ${format(getWeekDays(selectedDate)[0], 'dd MMMM', { locale: fr })}`
                  }
                </p>
                {isToday(selectedDate) && viewMode === 'day' && (
                  <span className="text-xs text-primary-600 font-medium">Aujourd'hui</span>
                )}
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bouton aujourd'hui */}
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>

            {/* Bouton actualiser */}
            <button
              onClick={() => refetch()}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Vue planning */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        {viewMode === 'day' ? (
          <DayView 
            date={selectedDate} 
            reservations={getReservationsForDate(selectedDate)}
            creneaux={creneaux}
            salles={salles}
            planningData={planningData}
          />
        ) : (
          <WeekView 
            dates={getWeekDays(selectedDate)} 
            getReservationForSlot={getReservationForSlot}
            creneaux={creneaux}
          />
        )}
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <span className="text-sm text-gray-600">Salle réservée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Salle disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Créneau en cours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayView = ({ date, reservations, creneaux, salles, planningData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b">
              Créneaux
            </th>
            {salles?.map(salle => (
              <th key={salle.id} className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-b border-l">
                <div>
                  <p className="font-semibold">{salle.nom}</p>
                  <p className="text-xs text-gray-500">Cap. {salle.capacite}</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {creneaux?.map(creneau => {
            const isCurrentSlot = isCurrentTimeSlot(creneau);
            
            return (
              <tr key={creneau.id} className={isCurrentSlot ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 border-r">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{creneau.nom}</p>
                      <p className="text-xs text-gray-500">
                        {creneau.heure_debut} - {creneau.heure_fin}
                      </p>
                    </div>
                  </div>
                </td>
                {salles?.map(salle => {
                  // Chercher une réservation pour cette salle et ce créneau
                  const reservation = planningData?.planning?.[creneau.nom]?.find(res => 
                    res.salle_detail?.id === salle.id
                  );
                  
                  return (
                    <td key={`${creneau.id}-${salle.id}`} className="px-4 py-4 border-l">
                      {reservation ? (
                        <ReservationCell reservation={reservation} />
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-full h-2 bg-gray-100 rounded"></div>
                          <p className="text-xs text-gray-400 mt-2">Disponible</p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const WeekView = ({ dates, getReservationForSlot, creneaux }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b">
              Créneaux
            </th>
            {dates.map(date => (
              <th key={date.toISOString()} className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-b border-l">
                <div>
                  <p className="font-semibold">
                    {format(date, 'EEEE', { locale: fr })}
                  </p>
                  <p className={`text-sm ${isToday(date) ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                    {format(date, 'dd/MM')}
                  </p>
                  {isToday(date) && (
                    <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1"></span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {creneaux?.map(creneau => {
            const isCurrentSlot = isCurrentTimeSlot(creneau);
            
            return (
              <tr key={creneau.id} className={isCurrentSlot ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 border-r">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{creneau.nom}</p>
                      <p className="text-xs text-gray-500">
                        {creneau.heure_debut} - {creneau.heure_fin}
                      </p>
                    </div>
                  </div>
                </td>
                {dates.map(date => {
                  const reservation = getReservationForSlot(date, creneau.id);
                  
                  return (
                    <td key={`${creneau.id}-${date.toISOString()}`} className="px-2 py-4 border-l">
                      {reservation ? (
                        <WeekReservationCell reservation={reservation} />
                      ) : (
                        <div className="text-center py-2">
                          <div className="w-full h-1 bg-gray-100 rounded"></div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ReservationCell = ({ reservation }) => {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
      <div className="flex items-start space-x-2">
        <Monitor className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary-900 truncate">
            {reservation.sujet || 'Réservation'}
          </p>
          <div className="flex items-center space-x-1 mt-1">
            <User className="w-3 h-3 text-primary-600" />
            <p className="text-xs text-primary-700">
              {reservation.enseignant_detail?.first_name} {reservation.enseignant_detail?.last_name}
            </p>
          </div>
          <p className="text-xs text-primary-600 mt-1">
            {reservation.formation_detail?.nom}
          </p>
        </div>
      </div>
    </div>
  );
};

const WeekReservationCell = ({ reservation }) => {
  return (
    <div className="bg-primary-100 rounded p-2 text-center">
      <p className="text-xs font-medium text-primary-900 truncate">
        {reservation.salle_detail?.nom}
      </p>
      <p className="text-xs text-primary-700 truncate">
        {reservation.enseignant_detail?.last_name}
      </p>
    </div>
  );
};

// Fonction utilitaire pour vérifier si c'est le créneau actuel
const isCurrentTimeSlot = (creneau) => {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  return currentTime >= creneau.heure_debut && currentTime <= creneau.heure_fin;
};

export default Planning;