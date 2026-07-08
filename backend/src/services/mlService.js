const axios = require('axios');

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '8000', 10),
  headers: process.env.ML_SERVICE_API_KEY
    ? { 'x-api-key': process.env.ML_SERVICE_API_KEY }
    : {},
});

/**
 * Appelle le microservice ML (Python / Flask-FastAPI, cf. dossier ml/ du repo)
 * pour obtenir une prédiction de prix. Correspond à ModeleML.predire() du diagramme
 * de classes, exposé côté équipe Data Science via une route HTTP (ex: POST /predict).
 *
 * Contrat attendu côté service Python :
 * Requête  : { marque, modele, annee, kilometrage, carburant, boiteVitesses,
 *              puissanceFiscale, etatVehicule, ville, nombreProprietaires }
 * Réponse  : {
 *   prixEstime: number,
 *   margeConfiance: { min: number, max: number },
 *   facteursExplicatifs: [{ feature: string, impact: number }, ...],
 *   nomVersionModele: string   // optionnel, pour vérification croisée
 * }
 */
async function predire(caracteristiques) {
  const { data } = await mlClient.post('/predict', {
    marque: caracteristiques.marque,
    modele: caracteristiques.modele,
    annee: caracteristiques.annee,
    kilometrage: caracteristiques.kilometrage,
    carburant: caracteristiques.carburant,
    boiteVitesses: caracteristiques.boiteVitesses,
    puissanceFiscale: caracteristiques.puissanceFiscale,
    etatVehicule: caracteristiques.etatVehicule,
    ville: caracteristiques.ville,
    nombreProprietaires: caracteristiques.nombreProprietaires || 1,
  });
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

module.exports = { predire, healthCheck };
