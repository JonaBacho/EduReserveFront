// src/utils/utils.js
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date en français
 * @param {Date|string} date - La date à formater
 * @param {string} formatStr - Le format de sortie
 * @returns {string} La date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
};

/**
 * Formate une date avec l'heure en français
 * @param {Date|string} date - La date à formater
 * @returns {string} La date et heure formatées
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy à HH:mm');
};

/**
 * Formate une date relative (aujourd'hui, demain, etc.)
 * @param {Date|string} date - La date à formater
 * @returns {string} La date relative
 */
export const formatRelativeDate = (date) => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Comparer seulement les dates (sans l'heure)
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    if (dateStr === todayStr) return 'Aujourd\'hui';
    if (dateStr === tomorrowStr) return 'Demain';
    if (dateStr === yesterdayStr) return 'Hier';
    
    return formatDate(date, 'EEEE dd MMMM');
  } catch (error) {
    console.error('Erreur lors du formatage de la date relative:', error);
    return formatDate(date);
  }
};

/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} str - La chaîne à capitaliser
 * @returns {string} La chaîne capitalisée
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Génère un ID unique
 * @returns {string} Un ID unique
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Débounce une fonction
 * @param {Function} func - La fonction à débouncer
 * @param {number} wait - Le délai d'attente en ms
 * @returns {Function} La fonction débouncée
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle une fonction
 * @param {Function} func - La fonction à throttler
 * @param {number} limit - La limite en ms
 * @returns {Function} La fonction throttlée
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Vérifie si une valeur est vide
 * @param {any} value - La valeur à vérifier
 * @returns {boolean} True si la valeur est vide
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text - Le texte à tronquer
 * @param {number} length - La longueur maximale
 * @returns {string} Le texte tronqué
 */
export const truncateText = (text, length = 100) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
};

/**
 * Formate un nombre avec des séparateurs de milliers
 * @param {number} num - Le nombre à formater
 * @returns {string} Le nombre formaté
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

/**
 * Valide une adresse email
 * @param {string} email - L'email à valider
 * @returns {boolean} True si l'email est valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Génère une couleur aléatoire en hex
 * @returns {string} Une couleur hex
 */
export const getRandomColor = () => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Scroll vers un élément
 * @param {string} elementId - L'ID de l'élément
 * @param {object} options - Options de scroll
 */
export const scrollToElement = (elementId, options = {}) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options
    });
  }
};

/**
 * Copie du texte dans le presse-papier
 * @param {string} text - Le texte à copier
 * @returns {Promise<boolean>} True si la copie a réussi
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    return false;
  }
};

/**
 * Télécharge un fichier
 * @param {string} url - L'URL du fichier
 * @param {string} filename - Le nom du fichier
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Obtient les initiales d'un nom
 * @param {string} name - Le nom
 * @returns {string} Les initiales
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

/**
 * Validation des mots de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {object} Résultat de la validation
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!password || password.length < 8) {
    result.isValid = false;
    result.errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return result;
};

/**
 * Calcule la force d'un mot de passe
 * @param {string} password - Le mot de passe
 * @returns {object} Score et niveau de force
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  let level = 'Très faible';

  if (!password) {
    return { score: 0, level: 'Aucun' };
  }

  // Longueur
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Complexité
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Déterminer le niveau
  if (score >= 5) level = 'Très fort';
  else if (score >= 4) level = 'Fort';
  else if (score >= 3) level = 'Moyen';
  else if (score >= 2) level = 'Faible';

  return { score, level };
};

export default {
  formatDate,
  formatDateTime,
  formatRelativeDate,
  capitalize,
  generateId,
  debounce,
  throttle,
  isEmpty,
  truncateText,
  formatNumber,
  isValidEmail,
  getRandomColor,
  scrollToElement,
  copyToClipboard,
  downloadFile,
  getInitials,
  validatePassword,
  getPasswordStrength
};