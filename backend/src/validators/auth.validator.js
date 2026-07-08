const { body } = require('express-validator');

const registerRules = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis.'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('email').trim().isEmail().withMessage("Format d'email invalide."),
  body('motDePasse')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage("Format d'email invalide."),
  body('motDePasse').notEmpty().withMessage('Le mot de passe est requis.'),
];

module.exports = { registerRules, loginRules };
