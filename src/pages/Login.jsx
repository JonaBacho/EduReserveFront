// src/pages/Login.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
  setLoading(true);
  try {
    const loginData = {
      identifier: data.identifier, 
      password: data.password
    };
    const result = await login(loginData);
    
    if (result.success) {
      toast.success('Connexion réussie !');
      navigate('/', { replace: true });
    } else {
      toast.error(result.error || 'Erreur de connexion');
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    toast.error('Erreur de connexion');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex">
      {/* Panel de gauche - Informations */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <BookOpen className="w-12 h-12 mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              EduReserve
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Système de gestion des réservations de salles et de matériel pédagogique
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Planning en temps réel</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Gestion des conflits automatique</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Interface intuitive et responsive</span>
            </div>
          </div>
        </div>
        
        {/* Motifs décoratifs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400 bg-opacity-20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 bg-opacity-20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Panel de droite - Formulaire */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden text-center mb-8">
            <BookOpen className="w-12 h-12 mx-auto text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">EduReserve</h1>
            <p className="text-gray-600">Connectez-vous à votre compte</p>
          </div>

          {/* Titre desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre espace de réservation</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nom d'utilisateur ou matricule */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Email ou matricule *
              </label>
              <input
                {...register('identifier', { 
                  required: 'Le nom d\'utilisateur ou matricule est requis',
                  minLength: {
                    value: 3,
                    message: 'Au moins 3 caractères requis'
                  }
                })}
                type="text"
                autoComplete="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Entrez votre nom d'utilisateur ou matricule"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 1,
                      message: 'Le mot de passe ne peut pas être vide'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Options de connexion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="mt-6 text-center">
            <div className="text-sm">
              <span className="text-gray-600">Pas encore de compte ? </span>
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                S'inscrire
              </Link>
            </div>
          </div>

          {/* Aide */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Besoin d'aide ?</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Utilisez votre nom d'utilisateur ou matricule pour vous connecter</li>
              <li>• Si vous avez oublié votre mot de passe, contactez l'administrateur</li>
              <li>• Les étudiants peuvent consulter le planning et les ressources</li>
              <li>• Les enseignants peuvent effectuer des réservations</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>EduReserve - Système de gestion des réservations</p>
            <p className="mt-1">Pour les établissements éducatifs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;