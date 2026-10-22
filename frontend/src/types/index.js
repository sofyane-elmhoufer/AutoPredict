// Constantes du formulaire (listes déroulantes) et description des objets
// échangés avec l'API. Les commentaires JSDoc plus bas servent de référence.

export const CARBURANTS = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL"];
export const BOITES_VITESSES = ["MANUELLE", "AUTOMATIQUE"];
export const ETATS_VEHICULE = ["EXCELLENT", "BON", "MOYEN", "A_REPARER"];

/**
 * @typedef {Object} CaracteristiquesVehicule
 * @property {string} marque
 * @property {string} modele
 * @property {number} annee
 * @property {number} kilometrage
 * @property {string} carburant - une valeur de CARBURANTS
 * @property {string} boiteVitesses - une valeur de BOITES_VITESSES
 * @property {number} puissanceFiscale
 * @property {string} etatVehicule - une valeur de ETATS_VEHICULE
 * @property {string} ville - une valeur reconnue du domaine ML (cf. /catalogue/domaine)
 * @property {boolean} premiereMain
 */

/**
 * @typedef {Object} Estimation
 * @property {number} idEstimation
 * @property {number} prixEstime
 * @property {{min: number, max: number}} margeConfiance
 * @property {{feature: string, impact: number}[]} facteursExplicatifs
 * @property {"CACHE"|"NOUVELLE_PREDICTION"} source
 * @property {string} dateEstimation
 */
