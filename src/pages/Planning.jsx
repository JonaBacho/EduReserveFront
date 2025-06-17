// src/pages/Planning.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Calendar, ChevronLeft, ChevronRight, Monitor, User, Clock, Loader, AlertCircle, RefreshCw, Laptop, Video } from 'lucide-react';
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
  const { data: creneaux, isLoading: loadingCreneaux, error: errorCreneaux } = useQuery(
    'creneaux',
    () => creneauService.getCreneaux(),
    {
      select: (response) => {
        const data = response.data.results || response.data;
        return Array.isArray(data) ? data : [];
      },
      onError: (error) => {
        console.error('Erreur lors du chargement des créneaux:', error);
        toast.error('Erreur lors du chargement des créneaux horaires');
      }
    }
  );

  // Charger les salles
  const { data: salles, isLoading: loadingSalles, error: errorSalles } = useQuery(
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
  const { data: planningData, isLoading: loadingPlanning, refetch, error: errorPlanning } = useQuery(
    ['planning', format(selectedDate, 'yyyy-MM-dd')],
    () => planningService.getPlanningGeneral({
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    {
      select: (response) => response.data,
      retry: 2,
      onError: (error) => {
        console.error('Erreur lors du chargement du planning:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur planning: ${errorInfo.message}`);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Charger le planning pour la semaine (mode semaine)
  const weekDates = getWeekDays(selectedDate);
  const { data: weekPlanningData, isLoading: loadingWeekPlanning } = useQuery(
    ['week-planning', weekDates.map(d => format(d, 'yyyy-MM-dd')).join(',')],
    async () => {
      try {
        const planningPromises = weekDates.map(async (date) => {
          try {
            const response = await planningService.getPlanningGeneral({
              date: format(date, 'yyyy-MM-dd')
            });
            return {
              date: format(date, 'yyyy-MM-dd'),
              data: response.data
            };
          } catch (error) {
            console.error(`Erreur pour la date ${format(date, 'yyyy-MM-dd')}:`, error);
            return {
              date: format(date, 'yyyy-MM-dd'),
              data: { planning: {} }
            };
          }
        });
        
        const results = await Promise.all(planningPromises);
        return results.reduce((acc, result) => {
          acc[result.date] = result.data;
          return acc;
        }, {});
      } catch (error) {
        console.error('Erreur lors du chargement du planning hebdomadaire:', error);
        throw error;
      }
    },
    {
      enabled: viewMode === 'week',
      retry: 1,
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

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Planning actualisé');
  };

  function getWeekDays(date) {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Commence le lundi
    return Array.from({ length: 5 }, (_, i) => addDays(start, i)); // Seulement les jours ouvrables
  }

  // Fonction corrigée pour récupérer les réservations d'un créneau
  const getReservationForSlot = (date, creneauNom) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (viewMode === 'week' && weekPlanningData && weekPlanningData[dateStr]) {
      const dayPlanning = weekPlanningData[dateStr];
      if (dayPlanning.planning && dayPlanning.planning[creneauNom]) {
        return dayPlanning.planning[creneauNom];
      }
    } else if (viewMode === 'day' && planningData && isSameDay(new Date(planningData.date || dateStr), date)) {
      if (planningData.planning && planningData.planning[creneauNom]) {
        return planningData.planning[creneauNom];
      }
    }
    
    return null;
  };

  const isLoading = loadingCreneaux || loadingSalles || 
                   (viewMode === 'day' ? loadingPlanning : loadingWeekPlanning);

  const hasError = errorCreneaux || errorSalles || errorPlanning;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  if (hasError || !creneaux || !salles) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">
            Impossible de charger les données du planning.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Réessayer
          </button>
        </div>
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
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                title="Précédent"
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
                title="Suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Aujourd'hui
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vue planning */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        {viewMode === 'day' ? (
          <DayView 
            date={selectedDate} 
            creneaux={creneaux}
            salles={salles}
            planningData={planningData}
            isLoading={loadingPlanning}
          />
        ) : (
          <WeekView 
            dates={getWeekDays(selectedDate)} 
            getReservationForSlot={getReservationForSlot}
            creneaux={creneaux}
            isLoading={loadingWeekPlanning}
          />
        )}
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Salle indisponible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayView = ({ date, creneaux, salles, planningData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
        <p className="text-gray-500">Chargement du planning...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b sticky left-0 bg-gray-50 z-10">
              Créneaux
            </th>
            {salles?.map(salle => (
              <th key={salle.id} className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-b border-l min-w-[200px]">
                <div>
                  <p className="font-semibold">{salle.nom}</p>
                  <p className="text-xs text-gray-500">Capacité: {salle.capacite}</p>
                  {salle.equipements && (
                    <p className="text-xs text-gray-400 truncate mt-1" title={salle.equipements}>
                      {salle.equipements}
                    </p>
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
                <td className="px-6 py-4 border-r sticky left-0 bg-white z-10">
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
                  // Récupérer les réservations pour ce créneau
                  const slotData = planningData?.planning?.[creneau.nom];
                  
                  // Chercher une réservation de salle pour cette salle spécifique
                  const salleReservation = slotData?.salle?.find(res => 
                    res.salle_detail?.id === salle.id
                  );
                  
                  // Récupérer toutes les réservations de matériel pour ce créneau
                  const materielReservations = slotData?.materiels || [];
                  
                  return (
                    <td key={`${creneau.id}-${salle.id}`} className="px-4 py-4 border-l">
                      {salleReservation ? (
                        <ReservationCell 
                          reservation={salleReservation} 
                          materielReservations={materielReservations}
                        />
                      ) : (
                        <EmptySlot isCurrentSlot={isCurrentSlot} />
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

const WeekView = ({ dates, getReservationForSlot, creneaux, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
        <p className="text-gray-500">Chargement du planning hebdomadaire...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b sticky left-0 bg-gray-50 z-10">
              Créneaux
            </th>
            {dates.map(date => (
              <th key={date.toISOString()} className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-b border-l min-w-[150px]">
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
                <td className="px-6 py-4 border-r sticky left-0 bg-white z-10">
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
                  const slotData = getReservationForSlot(date, creneau.nom);
                  
                  return (
                    <td key={`${creneau.id}-${date.toISOString()}`} className="px-2 py-4 border-l">
                      {slotData && (slotData.salle?.length > 0 || slotData.materiels?.length > 0) ? (
                        <WeekReservationCell slotData={slotData} />
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

const ReservationCell = ({ reservation, materielReservations }) => {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 hover:bg-primary-100 transition-colors">
      <div className="space-y-2">
        {/* Enseignant et sujet */}
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary-900 truncate">
              {reservation.sujet || 'Réservation'}
            </p>
            <p className="text-xs text-primary-700 truncate">
              {reservation.enseignant_detail?.first_name} {reservation.enseignant_detail?.last_name}
              {reservation.enseignant_detail?.matricule && (
                <span className="text-primary-600"> ({reservation.enseignant_detail.matricule})</span>
              )}
            </p>
          </div>
        </div>

        {/* Salle */}
        <div className="flex items-center space-x-2">
          <Monitor className="w-3 h-3 text-primary-600" />
          <p className="text-xs text-primary-700 truncate">
            {reservation.salle_detail?.nom}
          </p>
        </div>

        {/* Formation */}
        {reservation.formation_detail && (
          <p className="text-xs text-primary-600 truncate">
            {reservation.formation_detail.nom}
          </p>
        )}

        {/* Matériel associé */}
        {materielReservations && materielReservations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-primary-200">
            <div className="flex flex-wrap gap-1">
              {materielReservations.map((mat, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center space-x-1 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded"
                >
                  {mat.materiel_detail?.type === 'ordinateur' ? (
                    <Laptop className="w-3 h-3" />
                  ) : (
                    <Video className="w-3 h-3" />
                  )}
                  <span>{mat.materiel_detail?.nom}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WeekReservationCell = ({ slotData }) => {
  const salleReservation = slotData.salle?.[0];
  const materielCount = slotData.materiels?.length || 0;

  return (
    <div className="bg-primary-100 rounded p-2 text-center hover:bg-primary-200 transition-colors">
      {salleReservation && (
        <>
          <p className="text-xs font-medium text-primary-900 truncate">
            {salleReservation.salle_detail?.nom}
          </p>
          <p className="text-xs text-primary-700 truncate">
            {salleReservation.enseignant_detail?.last_name}
          </p>
          {materielCount > 0 && (
            <div className="flex justify-center items-center space-x-1 mt-1">
              <span className="text-xs text-primary-600">+{materielCount} mat.</span>
            </div>
          )}
        </>
      )}
      {!salleReservation && materielCount > 0 && (
        <p className="text-xs font-medium text-primary-900">
          {materielCount} matériel{materielCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

const EmptySlot = ({ isCurrentSlot }) => {
  return (
    <div className="text-center py-6">
      <div className={`w-full h-2 rounded ${isCurrentSlot ? 'bg-yellow-200' : 'bg-gray-100'}`}></div>
      <p className="text-xs text-gray-400 mt-2">Disponible</p>
    </div>
  );
};

// Fonction utilitaire pour vérifier si c'est le créneau actuel
const isCurrentTimeSlot = (creneau) => {
  if (!isToday(new Date())) return false;
  
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  return currentTime >= creneau.heure_debut && currentTime <= creneau.heure_fin;
};

export default Planning;