const crypto = require('crypto');

const KM_STEP = parseInt(process.env.KM_ROUNDING_STEP || '5000', 10);

/**
 * Normalise un texte : espaces en trop, minuscules et accents enlevés.
 */
function normalizeString(str) {
  if (str === undefined || str === null) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/\s+/g, ' ');
}

/**
 * Arrondit le kilométrage par tranche (pas de 5000 km) : deux kilométrages
 * très proches comptent alors comme la même demande.
 */
function roundMileage(km, step = KM_STEP) {
  return Math.round(Number(km) / step) * step;
}

/**
 * Normalise les caractéristiques saisies puis calcule leur empreinte SHA-256.
 * C'est cette empreinte qui sert de clé pour le cache.
 *
 * @param {Object} caracteristiques - données du formulaire
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
    premiereMain: Boolean(caracteristiques.premiereMain),
  };

  // On trie les clés pour que le même véhicule donne toujours le même hash
  const serialized = JSON.stringify(normalized, Object.keys(normalized).sort());
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');

  return { normalized, hash };
}

module.exports = { computeCacheHash, normalizeString, roundMileage };
