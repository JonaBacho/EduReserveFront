// src/pages/Statistiques.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Monitor,
  Package,
  Users,
  Clock,
  Loader,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  statistiquesService, 
  reservationService,
  salleService,
  materielService,
  handleApiError 
} from '../services/api';

const Statistiques = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [showExportModal, setShowExportModal] = useState(false);

  // Récupérer les statistiques générales
  const { data: stats, isLoading: loadingStats, error: errorStats, refetch: refetchStats } = useQuery(
    'statistiques',
    () => statistiquesService.getStatistiques(),
    {
      select: (response) => response.data,
      onError: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        const errorInfo = handleApiError(error);
        toast.error(`Erreur: ${errorInfo.message}`);
      }
    }
  );

  // Récupérer les réservations pour l'analyse temporelle
  const { data: reservationsSalles } = useQuery(
    ['reservations-salles-stats', dateRange],
    () => reservationService.getReservationsSalles({
      date_debut: getDateRangeStart(),
      date_fin: format(new Date(), 'yyyy-MM-dd')
    }),
    {
      select: (response) => response.data.results || response.data,
    }
  );

  const { data: reservationsMateriels } = useQuery(
    ['reservations-materiels-stats', dateRange],
    () => reservationService.getReservationsMateriels({
      date_debut: getDateRangeStart(),
      date_fin: format(new Date(), 'yyyy-MM-dd')
    }),
    {
      select: (response) => response.data.results || response.data,
    }
  );

  // Récupérer les données de base pour les statistiques
  const { data: salles } = useQuery(
    'salles-stats',
    () => salleService.getSalles(),
    {
      select: (response) => response.data.results || response.data,
    }
  );

  const { data: materiels } = useQuery(
    'materiels-stats',
    () => materielService.getMateriels(),
    {
      select: (response) => response.data.results || response.data,
    }
  );

  function getDateRangeStart() {
    switch (dateRange) {
      case '7days':
        return format(subDays(new Date(), 7), 'yyyy-MM-dd');
      case '30days':
        return format(subDays(new Date(), 30), 'yyyy-MM-dd');
      case 'thisMonth':
        return format(startOfMonth(new Date()), 'yyyy-MM-dd');
      case '90days':
        return format(subDays(new Date(), 90), 'yyyy-MM-dd');
      default:
        return format(subDays(new Date(), 30), 'yyyy-MM-dd');
    }
  }

  // Calculer les statistiques détaillées
  const getDetailedStats = () => {
    if (!reservationsSalles || !reservationsMateriels || !salles || !materiels) {
      return null;
    }

    const totalReservations = reservationsSalles.length + reservationsMateriels.length;
    
    // Statistiques par jour de la semaine
    const dayStats = {};
    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].forEach(day => {
      dayStats[day] = 0;
    });

    [...reservationsSalles, ...reservationsMateriels].forEach(reservation => {
      const date = new Date(reservation.date);
      const dayName = format(date, 'EEEE', { locale: fr });
      if (dayStats[dayName] !== undefined) {
        dayStats[dayName]++;
      }
    });

    // Top 5 des salles les plus réservées
    const salleReservations = {};
    reservationsSalles.forEach(reservation => {
      const salleName = reservation.salle_detail?.nom || 'Inconnu';
      salleReservations[salleName] = (salleReservations[salleName] || 0) + 1;
    });

    const topSalles = Object.entries(salleReservations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([nom, count]) => ({ nom, count }));

    // Top 5 des matériels les plus réservés
    const materielReservations = {};
    reservationsMateriels.forEach(reservation => {
      const materielName = reservation.materiel_detail?.nom || 'Inconnu';
      materielReservations[materielName] = (materielReservations[materielName] || 0) + 1;
    });

    const topMateriels = Object.entries(materielReservations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([nom, count]) => ({ nom, count }));

    // Taux d'occupation
    const totalSlots = salles.length * 5 * 4; // salles × jours × créneaux
    const occupationRate = totalSlots > 0 ? (reservationsSalles.length / totalSlots * 100) : 0;

    return {
      totalReservations,
      dayStats,
      topSalles,
      topMateriels,
      occupationRate: Math.round(occupationRate * 100) / 100,
      avgReservationsPerDay: Math.round(totalReservations / 30 * 100) / 100
    };
  };

  const detailedStats = getDetailedStats();

  const handleRefresh = () => {
    refetchStats();
    toast.success('Statistiques actualisées');
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Chargement des statistiques...</span>
      </div>
    );
  }

  if (errorStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">Erreur lors du chargement des statistiques</span>
        <button 
          onClick={handleRefresh}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Statistiques</h1>
            <p className="text-gray-600">
              Analysez l'utilisation des salles et du matériel pédagogique
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="thisMonth">Ce mois</option>
              <option value="90days">90 derniers jours</option>
            </select>
            
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Réservations salles"
          value={stats?.total_reservations_salles || 0}
          icon={Monitor}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Réservations matériels"
          value={stats?.total_reservations_materiels || 0}
          icon={Package}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Taux d'occupation"
          value={`${detailedStats?.occupationRate || 0}%`}
          icon={TrendingUp}
          color="orange"
          trend="+3%"
        />
        <StatCard
          title="Moy. par jour"
          value={detailedStats?.avgReservationsPerDay || 0}
          icon={Calendar}
          color="purple"
          trend="+5%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique par jour de la semaine */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par jour de la semaine
          </h3>
          {detailedStats ? (
            <DayOfWeekChart dayStats={detailedStats.dayStats} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          )}
        </div>

        {/* Top salles */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Salles les plus réservées
          </h3>
          {detailedStats ? (
            <TopResourcesList items={detailedStats.topSalles} type="salle" />
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          )}
        </div>

        {/* Top matériels */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Matériels les plus réservés
          </h3>
          {detailedStats ? (
            <TopResourcesList items={detailedStats.topMateriels} type="materiel" />
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          )}
        </div>

        {/* Évolution temporelle */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution des réservations
          </h3>
          <TimelineChart 
            reservationsSalles={reservationsSalles} 
            reservationsMateriels={reservationsMateriels}
          />
        </div>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques globales */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total des réservations</span>
              <span className="font-semibold text-gray-900">
                {(stats?.total_reservations_salles || 0) + (stats?.total_reservations_materiels || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Salles disponibles</span>
              <span className="font-semibold text-gray-900">{salles?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Matériels disponibles</span>
              <span className="font-semibold text-gray-900">{materiels?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Période d'analyse</span>
              <span className="font-semibold text-gray-900">
                {dateRange === '7days' ? '7 jours' :
                 dateRange === '30days' ? '30 jours' :
                 dateRange === 'thisMonth' ? 'Ce mois' :
                 '90 jours'}
              </span>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommandations
          </h3>
          <div className="space-y-4">
            {detailedStats?.occupationRate < 50 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Optimisation:</strong> Le taux d'occupation est faible ({detailedStats.occupationRate}%). 
                  Considérez promouvoir l'utilisation des salles.
                </p>
              </div>
            )}
            
            {detailedStats?.topSalles.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Populaire:</strong> La salle {detailedStats.topSalles[0].nom} est très demandée 
                  ({detailedStats.topSalles[0].count} réservations).
                </p>
              </div>
            )}
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Maintenance:</strong> Planifiez la maintenance du matériel pendant les créneaux 
                les moins utilisés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'export */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} stats={stats} />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <span className="text-sm font-medium text-green-600">{trend}</span>
            <p className="text-xs text-gray-500">vs période précédente</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DayOfWeekChart = ({ dayStats }) => {
  const maxValue = Math.max(...Object.values(dayStats));
  
  return (
    <div className="space-y-4">
      {Object.entries(dayStats).map(([day, count]) => (
        <div key={day} className="flex items-center space-x-4">
          <div className="w-20 text-sm font-medium text-gray-700">{day}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${maxValue > 0 ? (count / maxValue) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="w-12 text-sm font-semibold text-gray-900 text-right">{count}</div>
        </div>
      ))}
    </div>
  );
};

const TopResourcesList = ({ items, type }) => {
  const Icon = type === 'salle' ? Monitor : Package;
  
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.nom} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              index === 0 ? 'bg-yellow-500' :
              index === 1 ? 'bg-gray-400' :
              index === 2 ? 'bg-orange-600' : 'bg-gray-300'
            }`}>
              {index + 1}
            </div>
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">{item.nom}</span>
          </div>
          <span className="text-sm font-semibold text-primary-600">{item.count}</span>
        </div>
      ))}
    </div>
  );
};

const TimelineChart = ({ reservationsSalles, reservationsMateriels }) => {
  // Créer un graphique simple des 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const sallesCount = reservationsSalles?.filter(r => r.date === dateStr).length || 0;
    const materielsCount = reservationsMateriels?.filter(r => r.date === dateStr).length || 0;
    
    return {
      date: format(date, 'dd/MM'),
      salles: sallesCount,
      materiels: materielsCount,
      total: sallesCount + materielsCount
    };
  });

  const maxTotal = Math.max(...last7Days.map(d => d.total));

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Salles</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Matériels</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between space-x-2 h-40">
        {last7Days.map((day, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
            <div className="flex flex-col items-center space-y-1 w-full">
              <div 
                className="w-full bg-blue-500 rounded-t"
                style={{ 
                  height: `${maxTotal > 0 ? (day.salles / maxTotal) * 120 : 0}px`,
                  minHeight: day.salles > 0 ? '4px' : '0px'
                }}
              ></div>
              <div 
                className="w-full bg-green-500"
                style={{ 
                  height: `${maxTotal > 0 ? (day.materiels / maxTotal) * 120 : 0}px`,
                  minHeight: day.materiels > 0 ? '4px' : '0px'
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">{day.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExportModal = ({ onClose, stats }) => {
  const handleExport = (format) => {
    // Simuler l'export
    toast.success(`Export ${format.toUpperCase()} en cours...`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Exporter les statistiques
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Choisissez le format d'export souhaité
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">PDF</p>
                    <p className="text-sm text-gray-500">Rapport complet avec graphiques</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">CSV</p>
                    <p className="text-sm text-gray-500">Données brutes pour analyse</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Excel</p>
                    <p className="text-sm text-gray-500">Feuille de calcul avec formules</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;