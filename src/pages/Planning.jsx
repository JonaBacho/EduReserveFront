import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Monitor, User, Clock } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { mockData } from '../services/api';

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' ou 'week'

  // Données mock pour les réservations
  const reservations = [
    {
      id: 1,
      date: new Date(),
      creneau: { id: 1, nom: '08:00-10:00', heure_debut: '08:00', heure_fin: '10:00' },
      salle: { id: 1, nom: 'A101' },
      enseignant: { first_name: 'Pierre', last_name: 'Martin' },
      formation: { nom: 'Informatique L1' },
      sujet: 'Cours d\'algorithmique'
    },
    {
      id: 2,
      date: new Date(),
      creneau: { id: 2, nom: '10:15-12:15', heure_debut: '10:15', heure_fin: '12:15' },
      salle: { id: 2, nom: 'A102' },
      enseignant: { first_name: 'Marie', last_name: 'Durand' },
      formation: { nom: 'Informatique L2' },
      sujet: 'Base de données'
    },
    {
      id: 3,
      date: addDays(new Date(), 1),
      creneau: { id: 3, nom: '13:30-15:30', heure_debut: '13:30', heure_fin: '15:30' },
      salle: { id: 3, nom: 'B101' },
      enseignant: { first_name: 'Jean', last_name: 'Bernard' },
      formation: { nom: 'Mathématiques M1' },
      sujet: 'Algèbre linéaire'
    }
  ];

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
    return reservations.filter(res => isSameDay(new Date(res.date), date));
  };

  const getReservationForSlot = (date, creneauId) => {
    return reservations.find(res => 
      isSameDay(new Date(res.date), date) && res.creneau.id === creneauId
    );
  };

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
          </div>
        </div>
      </div>

      {/* Vue planning */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        {viewMode === 'day' ? (
          <DayView date={selectedDate} reservations={getReservationsForDate(selectedDate)} />
        ) : (
          <WeekView 
            dates={getWeekDays(selectedDate)} 
            getReservationForSlot={getReservationForSlot}
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

const DayView = ({ date, reservations }) => {
  const creneaux = mockData.creneaux;
  const salles = mockData.salles;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b">
              Créneaux
            </th>
            {salles.map(salle => (
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
          {creneaux.map(creneau => {
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
                {salles.map(salle => {
                  const reservation = reservations.find(res => 
                    res.creneau.id === creneau.id && res.salle.id === salle.id
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

const WeekView = ({ dates, getReservationForSlot }) => {
  const creneaux = mockData.creneaux;

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
          {creneaux.map(creneau => {
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
            {reservation.sujet}
          </p>
          <div className="flex items-center space-x-1 mt-1">
            <User className="w-3 h-3 text-primary-600" />
            <p className="text-xs text-primary-700">
              {reservation.enseignant.first_name} {reservation.enseignant.last_name}
            </p>
          </div>
          <p className="text-xs text-primary-600 mt-1">
            {reservation.formation.nom}
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
        {reservation.salle.nom}
      </p>
      <p className="text-xs text-primary-700 truncate">
        {reservation.enseignant.last_name}
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