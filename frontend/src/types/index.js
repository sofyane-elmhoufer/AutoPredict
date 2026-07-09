// Constantes alignées sur le diagramme de classes du cahier des charges
// AutoPredict. En JavaScript on n'a plus d'interfaces : ces valeurs servent
// à remplir les <select> et à documenter la forme des objets échangés
// avec l'API (voir les commentaires JSDoc ci-dessous à titre de référence).

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
 * @property {string} ville
 * @property {number} nombreProprietaires
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
