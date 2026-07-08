const crypto = require('crypto');

const KM_STEP = parseInt(process.env.KM_ROUNDING_STEP || '5000', 10);

/**
 * Normalise une chaîne de caractères : trim, minuscule, sans accents/espaces multiples.
 */
function normalizeString(str) {
  if (str === undefined || str === null) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/\s+/g, ' ');
}

/**
 * Arrondit le kilométrage par tranche fixe (ex. pas de 5000 km),
 * pour que deux kilométrages très proches soient reconnus comme la même demande.
 */
function roundMileage(km, step = KM_STEP) {
  return Math.round(Number(km) / step) * step;
}

/**
 * Étape 1 du cahier des charges : normalisation des caractéristiques saisies
 * puis calcul d'une empreinte unique (SHA-256) représentant la combinaison.
 *
 * @param {Object} caracteristiques - données brutes du formulaire véhicule
 * @returns {{ normalized: Object, hash: string }}
 */
function computeCacheHash(caracteristiques) {
  const normalized = {
    marque: normalizeString(caracteristiques.marque),
    modele: normalizeString(caracteristiques.modele),
    annee: Number(caracteristiques.annee),
    kilometrage: roundMileage(caracteristiques.kilometrage),
    carburant: normalizeString(caracteristiques.carburant),
    boiteVitesses: normalizeString(caracteristiques.boiteVitesses),
    puissanceFiscale: Number(caracteristiques.puissanceFiscale),
    etatVehicule: normalizeString(caracteristiques.etatVehicule),
    ville: normalizeString(caracteristiques.ville),
    nombreProprietaires: Number(caracteristiques.nombreProprietaires || 1),
  };

  // Sérialisation déterministe (clés triées) pour garantir un hash stable
  const serialized = JSON.stringify(normalized, Object.keys(normalized).sort());
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');

  return { normalized, hash };
}

module.exports = { computeCacheHash, normalizeString, roundMileage };
