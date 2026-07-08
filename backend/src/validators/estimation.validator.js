const { body } = require('express-validator');

const currentYear = new Date().getFullYear();

const estimationRules = [
  body('marque').trim().notEmpty().withMessage('La marque est requise.'),
  body('modele').trim().notEmpty().withMessage('Le modèle est requis.'),
  body('annee')
    .isInt({ min: 1970, max: currentYear + 1 })
    .withMessage(`L'année doit être comprise entre 1970 et ${currentYear + 1}.`),
  body('kilometrage')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Le kilométrage doit être un entier positif réaliste.'),
  body('carburant')
    .isIn(['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE', 'GPL'])
    .withMessage('Type de carburant invalide.'),
  body('boiteVitesses')
    .isIn(['MANUELLE', 'AUTOMATIQUE'])
    .withMessage('Type de boîte de vitesses invalide.'),
  body('puissanceFiscale')
    .isInt({ min: 1, max: 100 })
    .withMessage('Puissance fiscale invalide.'),
  body('etatVehicule')
    .isIn(['EXCELLENT', 'BON', 'MOYEN', 'A_REPARER'])
    .withMessage('État du véhicule invalide.'),
  body('ville').trim().notEmpty().withMessage('La ville est requise.'),
  body('nombreProprietaires')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Nombre de propriétaires invalide.'),
];

module.exports = { estimationRules };
