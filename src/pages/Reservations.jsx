// src/pages/Reservations.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Monitor, Laptop, Calendar, Clock, Check, AlertCircle, Loader, ArrowLeft, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { 
  formationService, 
  salleService, 
  materielService, 
  creneauService, 
  reservationService, 
  planningService,
  authService,
  handleApiError 
} from '../services/api';

const Reservations = () => {
  const [activeTab, setActiveTab] = useState('salle'); // 'salle' ou 'materiel'
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm();
  const watchedValues = watch();

  const { data: userProfile } = useQuery(
  'user-profile',
  () => authService.getProfile(),
  {
    select: (response) => response.data,
    onError: (error) => {
      console.error('Erreur profil:', error);
    }
  }
);

  // Charger les données nécessaires
  const { data: formations, isLoading: loadingFormations, error: errorFormations } = useQuery(
    'formations',
    () => formationService.getFormations(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur formations:', error);
        toast.error('Erreur lors du chargement des formations');
      }
    }
  );

  const { data: salles, isLoading: loadingSalles, error: errorSalles } = useQuery(
    'salles',
    () => salleService.getSalles(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur salles:', error);
        toast.error('Erreur lors du chargement des salles');
      }
    }
  );

  const { data: materiels, isLoading: loadingMateriels, error: errorMateriels } = useQuery(
    'materiels',
    () => materielService.getMateriels(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur matériels:', error);
        toast.error('Erreur lors du chargement du matériel');
      }
    }
  );

  const { data: creneaux, isLoading: loadingCreneaux, error: errorCreneaux } = useQuery(
    'creneaux',
    () => creneauService.getCreneaux(),
    {
      select: (response) => response.data.results || response.data,
      onError: (error) => {
        console.error('Erreur créneaux:', error);
        toast.error('Erreur lors du chargement des créneaux');
      }
    }
  );

  const handleTabChange = (newTab) => {
  setActiveTab(newTab);
  reset();
  setShowAvailability(false);
  setAvailabilityResult(null);
};

  const onSubmit = async (data) => {
  if (!availabilityResult?.disponible) {
    toast.error('Veuillez vérifier la disponibilité avant de confirmer');
    return;
  }

  if (!userProfile?.id) {
    toast.error('Impossible de récupérer les informations utilisateur');
    return;
  }

  setIsSubmitting(true);
  try {
    let result;
    if (activeTab === 'salle') {
      result = await reservationService.createReservationSalle({
        enseignant: userProfile.id, // Ajout de l'ID enseignant
        salle: parseInt(data.salle),
        formation: parseInt(data.formation),
        creneau: parseInt(data.creneau),
        date: data.date,
        sujet: data.sujet,
        commentaires: data.commentaires || ''
      });
    } else {
      result = await reservationService.createReservationMateriel({
        enseignant: userProfile.id, // Ajout de l'ID enseignant
        materiel: parseInt(data.materiel),
        formation: parseInt(data.formation),
        creneau: parseInt(data.creneau),
        date: data.date,
        commentaires: data.commentaires || ''
      });
    }
    
    toast.success(`Réservation de ${activeTab} créée avec succès !`);
    queryClient.invalidateQueries('mes-reservations');
    queryClient.invalidateQueries('planning');
    
    setTimeout(() => {
      navigate('/mes-reservations');
    }, 1500);
    
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    const errorInfo = handleApiError(error);
    toast.error(errorInfo.message);
  } finally {
    setIsSubmitting(false);
  }
};

  const checkAvailability = async () => {
  if (!watchedValues.date || !watchedValues.creneau || !watchedValues[activeTab]) {
    toast.error('Veuillez remplir tous les champs requis pour vérifier la disponibilité');
    return;
  }

  setCheckingAvailability(true);
  try {
    // Correction : Adapter les paramètres selon votre API
    const response = await planningService.checkDisponibilite({
      type_ressource: activeTab,
      ressource_id: parseInt(watchedValues[activeTab]),
      date: watchedValues.date,
      creneau_id: parseInt(watchedValues.creneau)
    });
    
    setAvailabilityResult(response.data);
    setShowAvailability(true);
    
    if (response.data.disponible) {
      toast.success('Ressource disponible !');
    } else {
      toast.warning('Ressource non disponible');
    }
    
  } catch (error) {
    console.error('Erreur vérification:', error);
    const errorInfo = handleApiError(error);
    toast.error(errorInfo.message);
    setAvailabilityResult(null);
    setShowAvailability(false);
  } finally {
    setCheckingAvailability(false);
  }
};

  const getMinDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  const getMaxDate = () => {
    return format(addDays(new Date(), 90), 'yyyy-MM-dd'); // 3 mois à l'avance
  };

  const isLoading = loadingFormations || loadingSalles || loadingMateriels || loadingCreneaux;
  const hasError = errorFormations || errorSalles || errorMateriels || errorCreneaux;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">
            Impossible de charger les données nécessaires.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Plus className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouvelle réservation</h1>
              <p className="text-gray-600">
                Réservez une salle ou du matériel pédagogique
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('salle')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'salle'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Réserver une salle</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('materiel')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'materiel'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Laptop className="w-4 h-4" />
                <span>Réserver du matériel</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de réservation *
                </label>
                <input
                  {...register('date', { 
                    required: 'La date est requise',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (selectedDate < today) {
                        return 'La date ne peut pas être antérieure à aujourd\'hui';
                      }
                      return true;
                    }
                  })}
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="form-input"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              {/* Créneau */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Créneau horaire *
                </label>
                <select
                  {...register('creneau', { required: 'Le créneau est requis' })}
                  className="form-select"
                >
                  <option value="">Sélectionnez un créneau</option>
                  {creneaux?.map(creneau => (
                    <option key={creneau.id} value={creneau.id}>
                      {creneau.nom} ({creneau.heure_debut} - {creneau.heure_fin})
                    </option>
                  ))}
                </select>
                {errors.creneau && (
                  <p className="mt-1 text-sm text-red-600">{errors.creneau.message}</p>
                )}
              </div>

              {/* Salle ou Matériel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'salle' ? 'Salle' : 'Matériel'} *
                </label>
                <select
                  {...register(activeTab, { 
                    required: `${activeTab === 'salle' ? 'La salle' : 'Le matériel'} est requis` 
                  })}
                  className="form-select"
                >
                  <option value="">
                    Sélectionnez {activeTab === 'salle' ? 'une salle' : 'du matériel'}
                  </option>
                  {activeTab === 'salle' 
                    ? salles?.filter(salle => salle.active).map(salle => (
                        <option key={salle.id} value={salle.id}>
                          {salle.nom} (capacité: {salle.capacite})
                          {salle.equipements && ` - ${salle.equipements.substring(0, 30)}...`}
                        </option>
                      ))
                    : materiels?.filter(materiel => materiel.active).map(materiel => (
                        <option key={materiel.id} value={materiel.id}>
                          {materiel.nom}
                          {materiel.type_materiel_detail && ` - ${materiel.type_materiel_detail.nom}`}
                          {materiel.numero_serie && ` (${materiel.numero_serie})`}
                        </option>
                      ))
                  }
                </select>
                {errors[activeTab] && (
                  <p className="mt-1 text-sm text-red-600">{errors[activeTab].message}</p>
                )}
              </div>

              {/* Formation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formation *
                </label>
                <select
                  {...register('formation', { required: 'La formation est requise' })}
                  className="form-select"
                >
                  <option value="">Sélectionnez une formation</option>
                  {formations?.map(formation => (
                    <option key={formation.id} value={formation.id}>
                      {formation.nom}
                    </option>
                  ))}
                </select>
                {errors.formation && (
                  <p className="mt-1 text-sm text-red-600">{errors.formation.message}</p>
                )}
              </div>
            </div>

            {/* Sujet (seulement pour les salles) */}
            {activeTab === 'salle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet du cours *
                </label>
                <input
                  {...register('sujet', { 
                    required: 'Le sujet est requis',
                    minLength: { value: 3, message: 'Le sujet doit contenir au moins 3 caractères' }
                  })}
                  type="text"
                  placeholder="Ex: Cours d'algorithmique, TP Python, Conférence sur l'IA..."
                  className="form-input"
                />
                {errors.sujet && (
                  <p className="mt-1 text-sm text-red-600">{errors.sujet.message}</p>
                )}
              </div>
            )}

            {/* Commentaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaires
              </label>
              <textarea
                {...register('commentaires')}
                rows={3}
                placeholder="Informations complémentaires, besoins spécifiques..."
                className="form-textarea"
              />
            </div>

            {/* Vérification de disponibilité */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Vérification de disponibilité
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={checkAvailability}
                  disabled={checkingAvailability || !watchedValues.date || !watchedValues.creneau || !watchedValues[activeTab]}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {checkingAvailability ? (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Vérification...</span>
                    </div>
                  ) : (
                    'Vérifier la disponibilité'
                  )}
                </button>
              </div>

              {showAvailability && availabilityResult && (
                <div className={`p-4 rounded-lg border ${
                  availabilityResult.disponible
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {availabilityResult.disponible ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        availabilityResult.disponible ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {availabilityResult.disponible ? 'Ressource disponible' : 'Ressource non disponible'}
                      </p>
                      {availabilityResult.conflit && (
                        <p className="text-sm text-red-700 mt-1">
                          {availabilityResult.conflit}
                        </p>
                      )}
                      {availabilityResult.disponible && (
                        <p className="text-sm text-green-700 mt-1">
                          Vous pouvez procéder à la réservation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!showAvailability && (
                <p className="text-sm text-gray-600">
                  Remplissez tous les champs requis et cliquez sur "Vérifier la disponibilité" 
                  avant de confirmer votre réservation.
                </p>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/mes-reservations')}
                className="btn-secondary"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !showAvailability || 
                  !availabilityResult?.disponible
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Création...</span>
                  </div>
                ) : (
                  'Créer la réservation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Aide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Aide pour la réservation</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Vérifiez toujours la disponibilité avant de confirmer</li>
          <li>• Les réservations peuvent être faites jusqu'à 3 mois à l'avance</li>
          <li>• Vous pouvez modifier ou annuler vos réservations dans "Mes réservations"</li>
          <li>• En cas de problème, contactez l'administration</li>
        </ul>
      </div>
    </div>
  );
};

export default Reservations;