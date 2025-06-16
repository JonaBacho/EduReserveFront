import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, User, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Simuler une connexion réelle (à remplacer par votre API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Déterminer le type d'utilisateur basé sur le nom d'utilisateur
      const userType = data.username.startsWith('prof') ? 'enseignant' : 'etudiant';
      demoLogin(userType);
      
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (userType) => {
    demoLogin(userType);
    toast.success(`Connecté en tant que ${userType}`);
    navigate('/');
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
              Système de Réservations
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Gérez facilement vos réservations de salles et de matériel pédagogique
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
              <span className="text-primary-100">Interface intuitive</span>
            </div>
          </div>
        </div>
        
        {/* Motif décoratif */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400 bg-opacity-20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 bg-opacity-20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Panel de droite - Formulaire */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden text-center mb-8">
            <BookOpen className="w-12 h-12 mx-auto text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
            <p className="text-gray-600">Connectez-vous à votre compte</p>
          </div>

          {/* Titre desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre espace de réservation</p>
          </div>

          {/* Boutons de démo */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Connexion rapide (Démo) :</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('enseignant')}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span>Enseignant</span>
              </button>
              <button
                onClick={() => handleDemoLogin('etudiant')}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Étudiant</span>
              </button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou connectez-vous avec vos identifiants</span>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="prof.martin ou etudiant1"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Le mot de passe est requis' })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="password123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

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

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Système de gestion des réservations</p>
            <p className="mt-1">Établissement éducatif</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;