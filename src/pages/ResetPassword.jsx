import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword, user } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const watchNewPassword = watch('new_password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await resetPassword({
        old_password: data.old_password,
        new_password: data.new_password
      });
      
      if (result.success) {
        toast.success('Mot de passe modifié avec succès !');
        navigate('/');
      } else {
        toast.error(result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Rediriger si non connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-primary-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Accès restreint</h2>
            <p className="mt-2 text-gray-600">
              Vous devez être connecté pour changer votre mot de passe.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center space-x-2 text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel de gauche - Informations */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <Lock className="w-12 h-12 mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              Sécurité du compte
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Modifiez votre mot de passe pour maintenir la sécurité de votre compte
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Mot de passe sécurisé requis</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Protection de vos données</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span className="text-primary-100">Accès sécurisé aux réservations</span>
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
            <Lock className="w-12 h-12 mx-auto text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Changer le mot de passe</h1>
            <p className="text-gray-600">Pour {user.first_name} {user.last_name}</p>
          </div>

          {/* Titre desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Changer le mot de passe</h2>
            <p className="text-gray-600">
              Connecté en tant que <span className="font-medium">{user.first_name} {user.last_name}</span>
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ancien mot de passe */}
            <div>
              <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  {...register('old_password', { 
                    required: 'Le mot de passe actuel est requis' 
                  })}
                  type={showOldPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.old_password && (
                <p className="mt-1 text-sm text-red-600">{errors.old_password.message}</p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  {...register('new_password', { 
                    required: 'Le nouveau mot de passe est requis',
                    minLength: { 
                      value: 8, 
                      message: 'Le mot de passe doit contenir au moins 8 caractères' 
                    },
                    validate: (value) => {
                      const hasUpperCase = /[A-Z]/.test(value);
                      const hasLowerCase = /[a-z]/.test(value);
                      const hasNumbers = /\d/.test(value);
                      
                      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
                        return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
                      }
                      return true;
                    }
                  })}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Créez un nouveau mot de passe sécurisé"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
              )}
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Au moins 8 caractères</li>
                  <li>Au moins une majuscule (A-Z)</li>
                  <li>Au moins une minuscule (a-z)</li>
                  <li>Au moins un chiffre (0-9)</li>
                </ul>
              </div>
            </div>

            {/* Confirmation du nouveau mot de passe */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe *
              </label>
              <input
                {...register('confirm_password', { 
                  required: 'La confirmation du mot de passe est requise',
                  validate: (value) => 
                    value === watchNewPassword || 'Les mots de passe ne correspondent pas'
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirmez votre nouveau mot de passe"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial flex justify-center items-center space-x-2 px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Modification...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Modifier le mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Conseils de sécurité */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Conseils de sécurité</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Ne partagez jamais votre mot de passe</li>
              <li>• Utilisez un mot de passe unique pour ce compte</li>
              <li>• Changez votre mot de passe régulièrement</li>
              <li>• Déconnectez-vous des ordinateurs partagés</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>EduReserve - Sécurité et confidentialité</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;