// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Calendar, 
  BookOpen, 
  Monitor, 
  Users, 
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  Loader,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reservationService, statistiquesService } from '../services/api';
import { formatRelativeDate, formatDate } from '../utils/utils';
import { format, addDays, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user, isEnseignant } = useAuth();

  // Récupérer les réservations de l'utilisateur (si enseignant)
  const { data: mesReservations, isLoading: loadingReservations, error: errorReservations } = useQuery(
    'mes-reservations-dashboard',
    () => reservationService.getMesReservations({
      date_debut: format(new Date(), 'yyyy-MM-dd'),
      date_fin: format(addDays(new Date(), 7), 'yyyy-MM-dd')
    }),
    {
      enabled: isEnseignant,
      retry: 1,
      onError: (error) => {
        console.error('Erreur lors du chargement des réservations:', error);
      }
    }
  );

  // Récupérer les statistiques (pour les enseignants)
  const { data: statistiques, isLoading: loadingStats } = useQuery(
    'statistiques-dashboard',
    () => statistiquesService.getStatistiques(),
    {
      enabled: isEnseignant,
      retry: 1,
      onError: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }
  );

  // Calculer les statistiques rapides
  const getQuickStats = () => {
    if (!mesReservations) return { total: 0, aujourdhui: 0, demain: 0, semaine: 0 };

    const aujourdhui = format(new Date(), 'yyyy-MM-dd');
    const demain = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const dansSeptJours = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    const totalSalles = mesReservations.reservations_salles?.length || 0;
    const totalMateriels = mesReservations.reservations_materiels?.length || 0;

    const toutesReservations = [
      ...(mesReservations.reservations_salles || []),
      ...(mesReservations.reservations_materiels || [])
    ];

    const reservationsAujourdhui = toutesReservations.filter(res => res.date === aujourdhui).length;
    const reservationsDemain = toutesReservations.filter(res => res.date === demain).length;
    const reservationsSemaine = toutesReservations.filter(res => 
      res.date >= aujourdhui && res.date <= dansSeptJours
    ).length;

    return {
      total: totalSalles + totalMateriels,
      aujourdhui: reservationsAujourdhui,
      demain: reservationsDemain,
      semaine: reservationsSemaine
    };
  };

  const stats = getQuickStats();

  // Obtenir les prochaines réservations
  const getProchainesReservations = () => {
    if (!mesReservations) return [];

    const toutes = [
      ...(mesReservations.reservations_salles || []).map(res => ({
        ...res,
        type: 'salle',
        ressource: res.salle_detail?.nom,
        titre: res.sujet || 'Réservation de salle'
      })),
      ...(mesReservations.reservations_materiels || []).map(res => ({
        ...res,
        type: 'materiel',
        ressource: res.materiel_detail?.nom,
        titre: `Réservation de ${res.materiel_detail?.nom || 'matériel'}`
      }))
    ];

    return toutes
      .filter(res => !isPast(new Date(res.date)))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const prochainesReservations = getProchainesReservations();

  // Obtenir les actions recommandées
  const getRecommendedActions = () => {
    const actions = [];

    if (isEnseignant) {
      if (stats.total === 0) {
        actions.push({
          title: 'Créer votre première réservation',
          description: 'Commencez par réserver une salle ou du matériel',
          icon: Plus,
          href: '/reservations',
          color: 'blue'
        });
      }

      if (stats.aujourdhui === 0 && stats.demain === 0) {
        actions.push({
          title: 'Planifier pour demain',
          description: 'Vous n\'avez aucune réservation prévue pour demain',
          icon: Calendar,
          href: '/reservations',
          color: 'orange'
        });
      }

      actions.push({
        title: 'Consulter les statistiques',
        description: 'Analysez l\'utilisation de vos réservations',
        icon: TrendingUp,
        href: '/statistiques',
        color: 'purple'
      });
    }

    actions.push({
      title: 'Explorer le planning',
      description: 'Consultez la disponibilité des salles et matériels',
      icon: Calendar,
      href: '/planning',
      color: 'green'
    });

    return actions.slice(0, 3);
  };

  const recommendedActions = getRecommendedActions();

  if (loadingReservations && isEnseignant) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header de bienvenue */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-soft text-white overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Bonjour, {user?.first_name || user?.username} !
              </h1>
              <p className="text-primary-100 text-lg mb-1">
                {format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-primary-200 text-sm capitalize">
                Connecté en tant que {user?.user_type === 'enseignant' ? 'enseignant' : 'étudiant'}
              </p>
            </div>
            {isEnseignant && (
              <div className="hidden sm:block">
                <Link
                  to="/reservations"
                  className="inline-flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle réservation</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Motif décoratif */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isEnseignant ? (
          <>
            <StatCard
              title="Mes réservations"
              value={stats.total}
              icon={BookOpen}
              color="blue"
              link="/mes-reservations"
              subtitle="Total actives"
            />
            <StatCard
              title="Aujourd'hui"
              value={stats.aujourdhui}
              icon={Clock}
              color="green"
              link="/planning"
              subtitle="Réservations"
            />
            <StatCard
              title="Cette semaine"
              value={stats.semaine}
              icon={Calendar}
              color="orange"
              link="/planning"
              subtitle="À venir"
            />
            <StatCard
              title="Total global"
              value={statistiques?.data?.total_reservations_salles || 0}
              icon={TrendingUp}
              color="purple"
              link="/statistiques"
              subtitle="Réservations"
              isLoading={loadingStats}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Planning"
              value="Consulter"
              icon={Calendar}
              color="blue"
              link="/planning"
              isText={true}
              subtitle="Disponibilités"
            />
            <StatCard
              title="Salles"
              value="Explorer"
              icon={Monitor}
              color="green"
              link="/salles"
              isText={true}
              subtitle="Toutes les salles"
            />
            <StatCard
              title="Matériels"
              value="Découvrir"
              icon={BookOpen}
              color="orange"
              link="/materiels"
              isText={true}
              subtitle="Équipements"
            />
            <StatCard
              title="Formations"
              value="Voir"
              icon={Users}
              color="purple"
              link="/formations"
              isText={true}
              subtitle="Programmes"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prochaines réservations ou Planning */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-soft">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEnseignant ? 'Mes prochaines réservations' : 'Accès rapide'}
                </h2>
                {isEnseignant && prochainesReservations.length > 0 && (
                  <Link
                    to="/mes-reservations"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                  >
                    <span>Voir tout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
            <div className="p-6">
              {isEnseignant ? (
                errorReservations ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Erreur de chargement
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Impossible de charger vos réservations.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-primary"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : prochainesReservations.length > 0 ? (
                  <div className="space-y-4">
                    {prochainesReservations.map((reservation, index) => (
                      <ReservationCard key={`${reservation.type}-${reservation.id}-${index}`} reservation={reservation} />
                    ))}
                  </div>
                ) : (
                  <EmptyStateReservations />
                )
              ) : (
                <QuickAccessGrid />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar avec actions et informations */}
        <div className="space-y-6">
          {/* Actions recommandées */}
          <div className="bg-white rounded-lg shadow-soft">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Actions recommandées</h2>
            </div>
            <div className="p-6 space-y-4">
              {recommendedActions.map((action, index) => (
                <RecommendedAction key={index} action={action} />
              ))}
            </div>
          </div>

          {/* Informations utilisateur */}
          <div className="bg-white rounded-lg shadow-soft">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mon profil</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Nom d'utilisateur</span>
                  <span className="text-sm font-medium text-gray-900">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Matricule</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">{user?.matricule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                    {user?.user_type}
                  </span>
                </div>
                {user?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-32">{user.email}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  to="/reset-password"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                >
                  <span>Changer le mot de passe</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, link, subtitle, isText = false, isLoading = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const Component = link ? Link : 'div';
  const props = link ? { to: link } : {};

  return (
    <Component
      {...props}
      className={`bg-white rounded-lg shadow-soft p-6 ${link ? 'hover:shadow-medium transition-all duration-200 cursor-pointer hover:scale-105' : ''}`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="skeleton-text w-16 h-6 mt-1"></div>
          ) : (
            <p className={`${isText ? 'text-lg' : 'text-2xl'} font-semibold text-gray-900 mt-1`}>
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {link && (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </Component>
  );
};

const ReservationCard = ({ reservation }) => {
  const getTypeIcon = (type) => {
    return type === 'salle' ? Monitor : BookOpen;
  };

  const getTypeColor = (type) => {
    return type === 'salle' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const TypeIcon = getTypeIcon(reservation.type);

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className={`p-2 rounded-lg ${getTypeColor(reservation.type)}`}>
        <TypeIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {reservation.titre}
        </p>
        <div className="flex items-center space-x-4 mt-1">
          <span className="text-xs text-gray-500">
            {formatRelativeDate(reservation.date)}
          </span>
          <span className="text-xs text-gray-500">
            {reservation.creneau_detail?.nom}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {reservation.ressource}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isToday(new Date(reservation.date)) 
            ? 'bg-green-100 text-green-800' 
            : isTomorrow(new Date(reservation.date))
            ? 'bg-orange-100 text-orange-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isToday(new Date(reservation.date)) ? 'Aujourd\'hui' : 
           isTomorrow(new Date(reservation.date)) ? 'Demain' : 
           'À venir'}
        </span>
      </div>
    </div>
  );
};

const QuickAccessGrid = () => {
  const quickLinks = [
    {
      title: 'Consulter le planning',
      description: 'Voir la disponibilité des salles',
      icon: Calendar,
      href: '/planning',
      color: 'blue'
    },
    {
      title: 'Explorer les salles',
      description: 'Découvrir les salles disponibles',
      icon: Monitor,
      href: '/salles',
      color: 'green'
    },
    {
      title: 'Voir le matériel',
      description: 'Consulter les équipements',
      icon: BookOpen,
      href: '/materiels',
      color: 'orange'
    },
    {
      title: 'Formations',
      description: 'Parcourir les programmes',
      icon: Users,
      href: '/formations',
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {quickLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${link.color}-50 text-${link.color}-600 group-hover:scale-110 transition-transform`}>
              <link.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{link.title}</h3>
              <p className="text-xs text-gray-500">{link.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const RecommendedAction = ({ action }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Link
      to={action.href}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className={`p-2 rounded-lg ${colorClasses[action.color]} group-hover:scale-110 transition-transform`}>
        <action.icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
          {action.title}
        </h3>
        <p className="text-xs text-gray-500">
          {action.description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
    </Link>
  );
};

const EmptyStateReservations = () => {
  return (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation à venir</h3>
      <p className="text-gray-500 mb-6">
        Vous n'avez pas de réservations planifiées pour les prochains jours.
      </p>
      <Link
        to="/reservations"
        className="inline-flex items-center space-x-2 btn-primary"
      >
        <Plus className="w-4 h-4" />
        <span>Créer une réservation</span>
      </Link>
    </div>
  );
};

export default Dashboard;