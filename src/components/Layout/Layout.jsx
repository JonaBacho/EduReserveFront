// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  Monitor, 
  Home, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isEnseignant } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: Home, roles: ['enseignant', 'etudiant'] },
    { name: 'Planning', href: '/planning', icon: Calendar, roles: ['enseignant', 'etudiant'] },
    { name: 'Nouvelles réservations', href: '/reservations', icon: BookOpen, roles: ['enseignant'] },
    { name: 'Mes réservations', href: '/mes-reservations', icon: User, roles: ['enseignant'] },
    { name: 'Salles', href: '/salles', icon: Monitor, roles: ['enseignant', 'etudiant'] },
    { name: 'Matériels', href: '/materiels', icon: Monitor, roles: ['enseignant', 'etudiant'] },
    { name: 'Formations', href: '/formations', icon: Users, roles: ['enseignant', 'etudiant'] },
    { name: 'Statistiques', href: '/statistiques', icon: BarChart3, roles: ['enseignant'] },
  ].filter(item => item.roles.includes(user?.user_type));

  const handleLogout = async () => {
    try {
      logout();
      toast.success('Déconnexion réussie');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={closeSidebar}
        />
        <div className="fixed top-0 left-0 flex flex-col w-64 h-full bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">EduReserve</h1>
                <p className="text-xs text-gray-500">Réservations</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <Sidebar 
            navigation={navigation} 
            currentPath={location.pathname} 
            onLogout={handleLogout}
            onLinkClick={closeSidebar}
          />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">EduReserve</h1>
                <p className="text-xs text-gray-500">Gestion des réservations</p>
              </div>
            </div>
          </div>
          <Sidebar 
            navigation={navigation} 
            currentPath={location.pathname} 
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="ml-2 lg:ml-0">
                <h2 className="text-lg font-medium text-gray-900">
                  {getPageTitle(location.pathname)}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {getPageDescription(location.pathname)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profil utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'Utilisateur'
                    }
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.user_type === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                  </p>
                </div>
              </div>

              {/* Paramètres */}
              <Link
                to="/reset-password"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Paramètres du compte"
              >
                <Settings className="w-5 h-5" />
              </Link>
              
              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-500">
                © 2024 EduReserve. Tous droits réservés.
              </div>
              <div className="flex space-x-4 mt-2 sm:mt-0">
                <span className="text-xs text-gray-400">Version 1.0.0</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400">
                  Connecté en tant que {user?.user_type}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Sidebar = ({ navigation, currentPath, onLogout, onLinkClick }) => {
  return (
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onLinkClick}
            className={`
              group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${isActive
                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <item.icon
              className={`
                mr-3 flex-shrink-0 h-5 w-5 transition-colors
                ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
              `}
            />
            {item.name}
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          Se déconnecter
        </button>
      </div>
    </nav>
  );
};

const getPageTitle = (pathname) => {
  const titles = {
    '/': 'Tableau de bord',
    '/planning': 'Planning général',
    '/reservations': 'Nouvelles réservations',
    '/mes-reservations': 'Mes réservations',
    '/salles': 'Gestion des salles',
    '/materiels': 'Gestion du matériel',
    '/formations': 'Formations',
    '/statistiques': 'Statistiques',
    '/reset-password': 'Paramètres du compte',
  };
  return titles[pathname] || 'Page';
};

const getPageDescription = (pathname) => {
  const descriptions = {
    '/': 'Vue d\'ensemble de vos activités',
    '/planning': 'Consultez les réservations et la disponibilité',
    '/reservations': 'Créez de nouvelles réservations',
    '/mes-reservations': 'Gérez vos réservations existantes',
    '/salles': 'Consultez et gérez les salles disponibles',
    '/materiels': 'Consultez et gérez le matériel pédagogique',
    '/formations': 'Consultez les formations disponibles',
    '/statistiques': 'Analysez l\'utilisation des ressources',
    '/reset-password': 'Modifiez vos paramètres de sécurité',
  };
  return descriptions[pathname] || '';
};

export default Layout;