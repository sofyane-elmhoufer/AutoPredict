const { validationResult } = require('express-validator');

/**
 * À mettre après les règles express-validator d'une route.
 * Renvoie 422 avec la liste des champs invalides.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Données invalides.',
      errors: errors.array().map((e) => ({ champ: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Gestion globale des erreurs (placée en dernier dans app.js).
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Erreur non gérée :', err);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Cette ressource existe déjà (contrainte unique).' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      message: 'Erreur de validation base de données.',
      errors: err.errors.map((e) => e.message),
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Erreur interne du serveur.',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.originalUrl} introuvable.` });
}

module.exports = { handleValidationErrors, errorHandler, notFoundHandler };
