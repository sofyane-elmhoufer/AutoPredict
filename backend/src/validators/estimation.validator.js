const { body } = require('express-validator');
const mlService = require('../services/mlService');

const currentYear = new Date().getFullYear();

/**
 * Récupère le domaine d'entraînement (villes + bornes numériques). Si le service
 * ML est arrêté, on garde des bornes larges au lieu de bloquer le formulaire.
 */
async function domaineOuDefaut() {
  try {
    return await mlService.getDomaine();
  } catch {
    return {
      villes: null, // null = pas de restriction possible
      limites: {
        annee: { min: 1970, max: currentYear + 1 },
        kilometrage: { min: 0, max: 1000000 },
        puissanceFiscale: { min: 1, max: 100 },
      },
    };
  }
}

const estimationRules = [
  body('marque').trim().notEmpty().withMessage('La marque est requise.'),
  body('modele').trim().notEmpty().withMessage('Le modèle est requis.'),
  body('annee').custom(async (value) => {
    const { limites } = await domaineOuDefaut();
    const annee = Number(value);
    if (!Number.isInteger(annee) || annee < limites.annee.min || annee > limites.annee.max) {
      throw new Error(
        `L'année doit être comprise entre ${limites.annee.min} et ${limites.annee.max} (limite du modèle entraîné).`
      );
    }
    return true;
  }),
  body('kilometrage').custom(async (value) => {
    const { limites } = await domaineOuDefaut();
    const km = Number(value);
    if (!Number.isFinite(km) || km < limites.kilometrage.min || km > limites.kilometrage.max) {
      throw new Error(
        `Le kilométrage doit être compris entre ${limites.kilometrage.min} et ${limites.kilometrage.max} km (limite du modèle entraîné).`
      );
    }
    return true;
  }),
  body('carburant')
    .isIn(['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE', 'GPL'])
    .withMessage('Type de carburant invalide.'),
  body('boiteVitesses')
    .isIn(['MANUELLE', 'AUTOMATIQUE'])
    .withMessage('Type de boîte de vitesses invalide.'),
  body('puissanceFiscale').custom(async (value) => {
    const { limites } = await domaineOuDefaut();
    const cv = Number(value);
    if (!Number.isInteger(cv) || cv < limites.puissanceFiscale.min || cv > limites.puissanceFiscale.max) {
      throw new Error(
        `La puissance fiscale doit être comprise entre ${limites.puissanceFiscale.min} et ${limites.puissanceFiscale.max} CV (limite du modèle entraîné).`
      );
    }
    return true;
  }),
  body('etatVehicule')
    .isIn(['EXCELLENT', 'BON', 'MOYEN', 'A_REPARER'])
    .withMessage('État du véhicule invalide.'),
  body('ville')
    .trim()
    .notEmpty()
    .withMessage('La ville est requise.')
    .custom(async (value) => {
      const { villes } = await domaineOuDefaut();
      // villes === null : le service ML est injoignable, on ne vérifie pas la ville
      if (villes !== null && !villes.includes(value) && value !== 'Autre') {
        throw new Error('Ville non reconnue : merci de choisir une ville dans la liste proposée.');
      }
      return true;
    }),
  body('premiereMain')
    .isBoolean()
    .withMessage('Le champ "première main" doit être un booléen (oui/non).'),
];

module.exports = { estimationRules };
