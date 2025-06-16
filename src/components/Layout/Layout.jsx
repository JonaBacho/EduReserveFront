// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isEnseignant } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: Home },
    { name: 'Planning', href: '/planning', icon: Calendar },
    ...(isEnseignant ? [
      { name: 'Nouvelles réservations', href: '/reservations', icon: BookOpen },
      { name: 'Mes réservations', href: '/mes-reservations', icon: User },
    ] : []),
    { name: 'Salles', href: '/salles', icon: Monitor },
    { name: 'Matériels', href: '/materiels', icon: Monitor },
    { name: 'Formations', href: '/formations', icon: Users },
    ...(isEnseignant ? [
      { name: 'Statistiques', href: '/statistiques', icon: BarChart3 },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed top-0 left-0 flex flex-col w-64 h-full bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Réservations</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <Sidebar navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Réservations</h1>
            <p className="text-sm text-gray-500">Gestion des salles & matériels</p>
          </div>
          <Sidebar navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="ml-2 text-lg font-medium text-gray-900 lg:ml-0">
                {getPageTitle(location.pathname)}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.user_type}
                  </p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
      </div>
    </div>
  );
};

const Sidebar = ({ navigation, currentPath }) => {
  const { logout } = useAuth();

  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navigation.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
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
          onClick={logout}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
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
  };
  return titles[pathname] || 'Page';
};

export default Layout;