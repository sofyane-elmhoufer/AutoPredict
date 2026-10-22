const axios = require('axios');

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '8000', 10),
  headers: process.env.ML_SERVICE_API_KEY
    ? { 'x-api-key': process.env.ML_SERVICE_API_KEY }
    : {},
});

// Traduction des valeurs du formulaire vers celles du dataset d'entraînement
// (voir ml/src/preprocessing.py). Dans le formulaire les valeurs sont en
// majuscules (DIESEL, MANUELLE...), alors que le dataset Avito utilise des
// libellés comme "Diesel" ou "Manuelle". Ces tables font le lien entre les deux.
const CARBURANT_VERS_ML = {
  ESSENCE: 'Essence',
  DIESEL: 'Diesel',
  HYBRIDE: 'Hybride',
  ELECTRIQUE: 'Electrique',
  // Le GPL n'existe pas dans les données d'entraînement (et "Inconnu" non plus
  // pour le carburant). Un moteur GPL est un moteur essence converti, donc on
  // l'envoie comme "Essence". Sinon le modèle ne reconnaît pas la valeur et
  // baisse le prix d'environ 20 %.
  GPL: 'Essence',
};

const BOITE_VERS_ML = {
  MANUELLE: 'Manuelle',
  AUTOMATIQUE: 'Automatique',
};

const ETAT_VERS_ML = {
  EXCELLENT: 'Excellent',
  BON: 'Bon',
  MOYEN: 'Correct',
  A_REPARER: 'Endommagé',
};

/**
 * Transforme les caractéristiques du formulaire en payload pour le service ML.
 * La "première main" est envoyée directement en Oui / Non.
 */
function versPayloadML(caracteristiques) {
  return {
    marque: caracteristiques.marque,
    modele: caracteristiques.modele,
    annee: Number(caracteristiques.annee),
    kilometrage: Number(caracteristiques.kilometrage),
    carburant: CARBURANT_VERS_ML[caracteristiques.carburant] || 'Inconnu',
    boite_vitesses: BOITE_VERS_ML[caracteristiques.boiteVitesses] || 'Inconnu',
    puissance_fiscale: Number(caracteristiques.puissanceFiscale),
    etat: ETAT_VERS_ML[caracteristiques.etatVehicule] || 'Inconnu',
    ville: caracteristiques.ville,
    premiere_main: caracteristiques.premiereMain ? 'Oui' : 'Non',
  };
}

/**
 * Appelle le service ML (Flask, ml/src/api.py) pour obtenir le prix.
 *
 * Requête  : { marque, modele, annee, kilometrage, carburant, boite_vitesses,
 *              puissance_fiscale, etat, ville, premiere_main }
 * Réponse  : {
 *   prixEstime: number,
 *   margeConfiance: { min: number, max: number },
 *   facteursExplicatifs: [{ feature: string, impact: number }, ...],
 * }
 */
async function predire(caracteristiques) {
  const { data } = await mlClient.post('/predict', versPayloadML(caracteristiques));
  return data;
}

/**
 * Vérifie que le service ML répond (utilisé par le tableau de bord admin).
 */
async function healthCheck() {
  try {
    const { data } = await mlClient.get('/health', { timeout: 3000 });
    return { up: true, details: data };
  } catch (err) {
    return { up: false, details: err.message };
  }
}

// Domaine d'entraînement (villes connues + bornes numériques).
// On le garde 10 minutes en mémoire : il ne change qu'à chaque nouvel
// entraînement, pas besoin de rappeler le service ML à chaque ouverture du formulaire.
const DOMAINE_CACHE_DUREE_MS = 10 * 60 * 1000;
let domaineCache = { valeur: null, expireA: 0 };

async function getDomaine() {
  const maintenant = Date.now();
  if (domaineCache.valeur && domaineCache.expireA > maintenant) {
    return domaineCache.valeur;
  }
  const { data } = await mlClient.get('/domaine', { timeout: 5000 });
  domaineCache = { valeur: data, expireA: maintenant + DOMAINE_CACHE_DUREE_MS };
  return data;
}

module.exports = { predire, healthCheck, versPayloadML, getDomaine };
