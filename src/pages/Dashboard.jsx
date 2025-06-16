// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
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
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reservationService, statistiquesService } from '../services/api';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user, isEnseignant } = useAuth();

  // Récupérer les réservations de l'utilisateur
  const { data: mesReservations, isLoading: loadingReservations } = useQuery(
    'mes-reservations',
    () => reservationService.getMesReservations({
      date_debut: format(new Date(), 'yyyy-MM-dd'),
      date_fin: format(addDays(new Date(), 7), 'yyyy-MM-dd')
    }),
    {
      enabled: isEnseignant,
      onError: (error) => {
        console.error('Erreur lors du chargement des réservations:', error);
        toast.error('Erreur lors du chargement des réservations');
      }
    }
  );

  // Récupérer les statistiques (pour les enseignants)
  const { data: statistiques, isLoading: loadingStats } = useQuery(
    'statistiques',
    statistiquesService.getStatistiques,
    {
      enabled: isEnseignant,
      onError: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }
  );

  // Calculer les statistiques rapides
  const getQuickStats = () => {
    if (!mesReservations) return { total: 0, aujourdhui: 0, demain: 0 };

    const aujourdhui = format(new Date(), 'yyyy-MM-dd');
    const demain = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const totalSalles = mesReservations.reservations_salles?.length || 0;
    const totalMateriels = mesReservations.reservations_materiels?.length || 0;

    const reservationsAujourdhui = [
      ...(mesReservations.reservations_salles || []),
      ...(mesReservations.reservations_materiels || [])
    ].filter(res => res.date === aujourdhui).length;

    const reservationsDemain = [
      ...(mesReservations.reservations_salles || []),
      ...(mesReservations.reservations_materiels || [])
    ].filter(res => res.date === demain).length;

    return {
      total: totalSalles + totalMateriels,
      aujourdhui: reservationsAujourdhui,
      demain: reservationsDemain
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
        ressource: res.salle_detail?.nom
      })),
      ...(mesReservations.reservations_materiels || []).map(res => ({
        ...res,
        type: 'materiel',
        ressource: res.materiel_detail?.nom
      }))
    ];

    return toutes
      .filter(res => new Date(res.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const prochainesReservations = getProchainesReservations();

  if (loadingReservations && isEnseignant) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header de bienvenue */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {user?.first_name || user?.username} !
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              Connecté en tant que {user?.user_type}
            </p>
          </div>
          {isEnseignant && (
            <Link
              to="/reservations"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle réservation</span>
            </Link>
          )}
        </div>
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
            />
            <StatCard
              title="Aujourd'hui"
              value={stats.aujourdhui}
              icon={Clock}
              color="green"
              link="/planning"
            />
            <StatCard
              title="Demain"
              value={stats.demain}
              icon={Calendar}
              color="orange"
              link="/planning"
            />
            <StatCard
              title="Statistiques"
              value={statistiques?.total_reservations_salles || 0}
              icon={TrendingUp}
              color="purple"
              link="/statistiques"
              subtitle="Réservations totales"
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
            />
            <StatCard
              title="Salles"
              value="Explorer"
              icon={Monitor}
              color="green"
              link="/salles"
              isText={true}
            />
            <StatCard
              title="Matériels"
              value="Voir"
              icon={BookOpen}
              color="orange"
              link="/materiels"
              isText={true}
            />
            <StatCard
              title="Formations"
              value="Découvrir"
              icon={Users}
              color="purple"
              link="/formations"
              isText={true}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prochaines réservations (Enseignants) ou Planning général (Étudiants) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-soft">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEnseignant ? 'Mes prochaines réservations' : 'Planning du jour'}
            </h2>
          </div>
          <div className="p-6">
            {isEnseignant ? (
              prochainesReservations.length > 0 ? (
                <div className="space-y-4">
                  {prochainesReservations.map((reservation) => (
                    <ReservationCard key={`${reservation.type}-${reservation.id}`} reservation={reservation} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Aucune réservation"
                  description="Vous n'avez pas de réservations à venir."
                  actionLabel="Créer une réservation"
                  actionLink="/reservations"
                />
              )
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Consultez le planning</h3>
                <p className="text-gray-500 mb-4">
                  Voir les réservations de salles et la disponibilité du matériel.
                </p>
                <Link
                  to="/planning"
                  className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Voir le planning</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar avec actions rapides et informations */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow-soft">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
            </div>
            <div className="p-6 space-y-3">
              <QuickAction
                icon={Calendar}
                label="Voir le planning"
                href="/planning"
              />
              <QuickAction
                icon={Monitor}
                label="Consulter les salles"
                href="/salles"
              />
              <QuickAction
                icon={BookOpen}
                label="Explorer le matériel"
                href="/materiels"
              />
              <QuickAction
                icon={Users}
                label="Voir les formations"
                href="/formations"
              />
              {isEnseignant && (
                <QuickAction
                  icon={TrendingUp}
                  label="Voir les statistiques"
                  href="/statistiques"
                />
              )}
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
                  <span className="text-sm font-medium text-gray-900">{user?.matricule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{user?.user_type}</span>
                </div>
                {user?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-900">{user.email}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/reset-password"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Changer le mot de passe
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, link, subtitle, isText = false }) => {
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
      className={`bg-white rounded-lg shadow-soft p-6 ${link ? 'hover:shadow-medium transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`${isText ? 'text-lg' : 'text-2xl'} font-semibold text-gray-900`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Component>
  );
};

const ReservationCard = ({ reservation }) => {
  const getDateLabel = (date) => {
    const reservationDate = new Date(date);
    if (isToday(reservationDate)) return 'Aujourd\'hui';
    if (isTomorrow(reservationDate)) return 'Demain';
    return format(reservationDate, 'EEEE dd/MM', { locale: fr });
  };

  const getTypeIcon = (type) => {
    return type === 'salle' ? Monitor : BookOpen;
  };

  const getTypeColor = (type) => {
    return type === 'salle' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const TypeIcon = getTypeIcon(reservation.type);

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${getTypeColor(reservation.type)}`}>
        <TypeIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {reservation.sujet || `Réservation ${reservation.type}`}
        </p>
        <div className="flex items-center space-x-4 mt-1">
          <span className="text-xs text-gray-500">
            {getDateLabel(reservation.date)}
          </span>
          <span className="text-xs text-gray-500">
            {reservation.creneau_detail?.nom}
          </span>
          <span className="text-xs text-gray-500">
            {reservation.ressource}
          </span>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, href }) => {
  return (
    <Link
      to={href}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
    </Link>
  );
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionLink }) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Link>
      )}
    </div>
  );
};

export default Dashboard;
