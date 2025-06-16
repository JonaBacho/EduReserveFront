// src/pages/Reservations.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { Plus, Monitor, Laptop, Calendar, Clock, Check, AlertCircle, Loader } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { 
  formationService, 
  salleService, 
  materielService, 
  creneauService, 
  reservationService, 
  planningService,
  handleApiError 
} from '../services/api';

const Reservations = () => {
  const [activeTab, setActiveTab] = useState('salle'); // 'salle' ou 'materiel'
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const watchedValues = watch();

  // Charger les données nécessaires
  const { data: formations, isLoading: loadingFormations } = useQuery(
    'formations',
    () => formationService.getFormations(),
    {
      select: (response) => response.data.results || response.data
    }
  );

  const { data: salles, isLoading: loadingSalles } = useQuery(
    'salles',
    () => salleService.getSalles(),
    {
      select: (response) => response.data.results || response.data
    }
  );

  const { data: materiels, isLoading: loadingMateriels } = useQuery(
    'materiels',
    () => materielService.getMateriels(),
    {
      select: (response) => response.data.results || response.data
    }
  );

  const { data: creneaux, isLoading: loadingCreneaux } = useQuery(
    'creneaux',
    () => creneauService.getCreneaux(),
    {
      select: (response) => response.data.results || response.data
    }
  );

  const onSubmit = async (data) => {
    try {
      let result;
      if (activeTab === 'salle') {
        result = await reservationService.createReservationSalle({
          salle: parseInt(data.salle),
          formation: parseInt(data.formation),
          creneau: parseInt(data.creneau),
          date: data.date,
          sujet: data.sujet,
          commentaires: data.commentaires || ''
        });
      } else {
        result = await reservationService.createReservationMateriel({
          materiel: parseInt(data.materiel),
          formation: parseInt(data.formation),
          creneau: parseInt(data.creneau),
          date: data.date,
          commentaires: data.commentaires || ''
        });
      }
      
      toast.success(`Réservation de ${activeTab} créée avec succès !`);
      reset();
      setShowAvailability(false);
      setAvailabilityResult(null);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const checkAvailability = async () => {
    if (!watchedValues.date || !watchedValues.creneau || !watchedValues[activeTab]) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await planningService.checkDisponibilite({
        type_ressource: activeTab,
        ressource_id: parseInt(watchedValues[activeTab]),
        date: watchedValues.date,
        creneau_id: parseInt(watchedValues.creneau)
      });
      
      setAvailabilityResult(response.data);
      setShowAvailability(true);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center space-x-3">
          <Plus className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvelle réservation</h1>
            <p className="text-gray-600">
              Réservez une salle ou du matériel pédagogique
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab('salle');
                reset();
                setShowAvailability(false);
              }}
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
              onClick={() => {
                setActiveTab('materiel');
                reset();
                setShowAvailability(false);
              }}
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
                  {...register('date', { required: 'La date est requise' })}
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  {...register(activeTab, { required: `${activeTab === 'salle' ? 'La salle' : 'Le matériel'} est requis` })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">
                    Sélectionnez {activeTab === 'salle' ? 'une salle' : 'du matériel'}
                  </option>
                  {activeTab === 'salle' 
                    ? salles?.map(salle => (
                        <option key={salle.id} value={salle.id}>
                          {salle.nom} (capacité: {salle.capacite})
                        </option>
                      ))
                    : materiels?.map(materiel => (
                        <option key={materiel.id} value={materiel.id}>
                          {materiel.nom}
                          {materiel.type_materiel_detail && ` - ${materiel.type_materiel_detail.nom}`}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  {...register('sujet', { required: 'Le sujet est requis' })}
                  type="text"
                  placeholder="Ex: Cours d'algorithmique, TP Python..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                placeholder="Informations complémentaires..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Vérification de disponibilité */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Vérification de disponibilité
                </h3>
                <button
                  type="button"
                  onClick={checkAvailability}
                  disabled={checkingAvailability}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {checkingAvailability ? (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Vérification...</span>
                    </div>
                  ) : (
                    'Vérifier'
                  )}
                </button>
              </div>

              {showAvailability && (
                <div className={`p-3 rounded-lg border ${
                  availabilityResult?.disponible
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {availabilityResult?.disponible ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        availabilityResult?.disponible ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {availabilityResult?.disponible ? 'Disponible' : 'Non disponible'}
                      </p>
                      {availabilityResult?.conflit && (
                        <p className="text-sm text-red-700 mt-1">
                          {availabilityResult.conflit}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setShowAvailability(false);
                  setAvailabilityResult(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={showAvailability && !availabilityResult?.disponible}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Créer la réservation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Reservations;