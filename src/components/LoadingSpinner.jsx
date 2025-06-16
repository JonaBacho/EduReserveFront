// src/components/LoadingSpinner.jsx
import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Chargement...', 
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader className={`${sizeClasses[size]} animate-spin text-primary-600 mx-auto mb-4`} />
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="text-center">
        <Loader className={`${sizeClasses[size]} animate-spin text-primary-600 mx-auto mb-2`} />
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      </div>
    </div>
  );
};

// Composant pour les états de chargement inline
export const InlineSpinner = ({ size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <Loader className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
};

// Composant pour les boutons de chargement
export const ButtonSpinner = ({ children, loading, ...props }) => {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <InlineSpinner size="small" className="text-current" />
          <span>Chargement...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Composant pour le chargement de page
export const PageLoader = ({ message = 'Chargement de la page...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

// Composant pour le chargement de contenu
export const ContentLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`h-4 bg-gray-200 rounded mb-3 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}></div>
      ))}
    </div>
  );
};

// Composant pour le chargement de cartes
export const CardLoader = ({ count = 3, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-soft p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;