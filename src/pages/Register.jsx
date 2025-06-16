// src/pages/Register.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, User, Mail, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword, getPasswordStrength } from '../utils/utils';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const watchPassword = watch('password');
  const passwordStrength = getPasswordStrength(watchPassword || '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Validation côté client du mot de passe
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        passwordValidation.errors.forEach(error => toast.error(error));
        setLoading(false);
        return;
      }

      const result = await registerUser(data);
      
      if (result.success) {
        toast.success('Compte créé avec succès ! Vous êtes maintenant connecté.');
        navigate('/', { replace: true });
      } else {
        if (result.details) {
          // Afficher les erreurs de validation spécifiques
          Object.entries(result.details).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(message => toast.error(`${getFieldLabel(field)}: ${message}`));
            } else {
              toast.error(`${getFieldLabel(field)}: ${messages}`);
            }
          });
        } else {
          toast.error(result.error || 'Erreur lors de la création du compte');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field) => {
    const labels = {
      username: 'Nom d\'utilisateur',
      matricule: 'Matricule',
      email: 'Email',
      password: 'Mot de passe',
      first_name: 'Prénom',
      last_name: 'Nom',
      user_type: 'Type d\'utilisateur'
    };
    return labels[field] || field;
  };

  const getPasswordStrengthColor = (level) => {
    switch (level) {
      case 'Très fort': return 'text-green-600 bg-green-100';
      case 'Fort': return 'text-green-600 bg-green-100';
      case 'Moyen': return 'text-yellow-600 bg-yellow-100';
      case 'Faible': return 'text-orange-600 bg-orange-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getPasswordStrengthWidth = (score) => {
    return `${Math.max((score / 6) * 100, 10)}%`;
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
              Rejoignez EduReserve
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Créez votre compte pour accéder au système de réservations
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-primary-300" />
              <span className="text-primary-100">Réservation rapide et intuitive</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-primary-300" />
              <span className="text-primary-100">Suivi de vos réservations</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-primary-300" />
              <span className="text-primary-100">Accès au planning complet</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-primary-300" />
              <span className="text-primary-100">Interface moderne et responsive</span>
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
            <p className="text-gray-600">Créez votre compte</p>
          </div>

          {/* Titre desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h2>
            <p className="text-gray-600">Rejoignez la plateforme de réservation</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nom d'utilisateur *
              </label>
              <input
                {...register('username', { 
                  required: 'Le nom d\'utilisateur est requis',
                  minLength: { value: 3, message: 'Au moins 3 caractères' },
                  maxLength: { value: 150, message: 'Maximum 150 caractères' },
                  pattern: {
                    value: /^[\w.@+-]+$/,
                    message: 'Caractères autorisés: lettres, chiffres, @, ., +, -, _'
                  }
                })}
                type="text"
                autoComplete="username"
                className="form-input"
                placeholder="Ex: jdupont ou prof.martin"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Ce nom sera utilisé pour vous connecter
              </p>
            </div>

            {/* Matricule */}
            <div>
              <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Matricule *
              </label>
              <input
                {...register('matricule', { 
                  required: 'Le matricule est requis',
                  maxLength: { value: 11, message: 'Maximum 11 caractères' },
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: 'Le matricule ne peut contenir que des lettres et des chiffres'
                  }
                })}
                type="text"
                autoComplete="off"
                className="form-input"
                placeholder="Ex: 20241234567"
              />
              {errors.matricule && (
                <p className="mt-1 text-sm text-red-600">{errors.matricule.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Votre matricule d'étudiant ou d'enseignant
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Adresse email
              </label>
              <input
                {...register('email', { 
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Adresse email invalide'
                  },
                  maxLength: { value: 254, message: 'Email trop long' }
                })}
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="votre.email@ecole.fr"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optionnel - pour la récupération de compte
              </p>
            </div>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  {...register('first_name', {
                    maxLength: { value: 150, message: 'Maximum 150 caractères' }
                  })}
                  type="text"
                  autoComplete="given-name"
                  className="form-input"
                  placeholder="Jean"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  {...register('last_name', {
                    maxLength: { value: 150, message: 'Maximum 150 caractères' }
                  })}
                  type="text"
                  autoComplete="family-name"
                  className="form-input"
                  placeholder="Dupont"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Type d'utilisateur */}
            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700 mb-2">
                Type d'utilisateur *
              </label>
              <select
                {...register('user_type', { required: 'Le type d\'utilisateur est requis' })}
                className="form-select"
              >
                <option value="">Sélectionnez votre statut</option>
                <option value="enseignant">Enseignant</option>
                <option value="etudiant">Étudiant</option>
              </select>
              {errors.user_type && (
                <p className="mt-1 text-sm text-red-600">{errors.user_type.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Les enseignants peuvent effectuer des réservations
              </p>
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
                    minLength: { value: 8, message: 'Au moins 8 caractères' },
                    validate: (value) => {
                      const validation = validatePassword(value);
                      return validation.isValid || validation.errors[0];
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input pr-10"
                  placeholder="Créez un mot de passe sécurisé"
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
              
              {/* Indicateur de force du mot de passe */}
              {watchPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Force du mot de passe</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPasswordStrengthColor(passwordStrength.level)}`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-green-500' :
                        passwordStrength.score >= 3 ? 'bg-yellow-500' :
                        passwordStrength.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: getPasswordStrengthWidth(passwordStrength.score) }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Au moins 8 caractères</li>
                  <li>Au moins une majuscule (A-Z)</li>
                  <li>Au moins une minuscule (a-z)</li>
                  <li>Au moins un chiffre (0-9)</li>
                  <li>Recommandé: des caractères spéciaux (!@#$%...)</li>
                </ul>
              </div>
            </div>

            {/* Bouton de création */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Lien de connexion */}
          <div className="mt-6 text-center">
            <div className="text-sm">
              <span className="text-gray-600">Déjà un compte ? </span>
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>

          {/* Conditions d'utilisation */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Conditions d'utilisation</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Votre compte sera vérifié par l'administration</li>
              <li>• Les informations fournies doivent être exactes</li>
              <li>• Respectez les règles d'utilisation des équipements</li>
              <li>• Signalez tout problème technique à l'administration</li>
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

export default Register;