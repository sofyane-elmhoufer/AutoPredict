const axios = require('axios');

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '8000', 10),
  headers: process.env.ML_SERVICE_API_KEY
    ? { 'x-api-key': process.env.ML_SERVICE_API_KEY }
    : {},
});

// --- Traduction du modèle métier (formulaire web) vers le contrat attendu ---
// par le pipeline scikit-learn entraîné (cf. ml/src/train.py + preprocessing.py).
// Le dataset d'entraînement (Avito) utilise des libellés français avec une
// casse spécifique ; les enums du formulaire web sont volontairement différents
// (en majuscules, en français normalisé) pour rester indépendants du choix
// technique de l'équipe Data. C'est ce mapping qui fait le pont entre les deux.
const CARBURANT_VERS_ML = {
  ESSENCE: 'Essence',
  DIESEL: 'Diesel',
  HYBRIDE: 'Hybride',
  ELECTRIQUE: 'Electrique',
  // GPL n'existe pas dans le jeu d'entraînement : on le traite comme la
  // catégorie "Inconnu" déjà vue à l'entraînement (imputation), plutôt que
  // de laisser passer une valeur totalement inconnue de l'encodeur.
  GPL: 'Inconnu',
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
 * Le dataset d'entraînement ne connaît pas le "nombre de propriétaires" mais
 * un booléen "première main" (Oui/Non). On approxime : un véhicule avec un
 * seul propriétaire correspond à "première main".
 */
function versPremiereMain(nombreProprietaires) {
  return Number(nombreProprietaires) <= 1 ? 'Oui' : 'Non';
}

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
    premiere_main: versPremiereMain(caracteristiques.nombreProprietaires || 1),
  };
}

/**
 * Appelle le microservice ML (Flask, cf. ml/src/api.py) pour obtenir une
 * prédiction de prix. Correspond à ModeleML.predire() du diagramme de classes.
 *
 * Contrat attendu côté service Python (voir ml/src/api.py) :
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
 * Vérifie que le service ML est disponible (utilisé par le dashboard admin
 * et pour un health-check global de la plateforme).
 */
async function healthCheck() {
  try {
    const { data } = await mlClient.get('/health', { timeout: 3000 });
    return { up: true, details: data };
  } catch (err) {
    return { up: false, details: err.message };
  }
}

module.exports = { predire, healthCheck, versPayloadML };
