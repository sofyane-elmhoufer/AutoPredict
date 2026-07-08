const express = require('express');
const router = express.Router();
const estimationController = require('../controllers/estimation.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/error.middleware');
const { estimationRules } = require('../validators/estimation.validator');

// Accessible au Visiteur (optionalAuth) et à l'Utilisateur connecté :
// si connecté, l'estimation est automatiquement rattachée à son historique.
router.post(
  '/',
  optionalAuth,
  estimationRules,
  handleValidationErrors,
  estimationController.creerEstimation
);

// Le reste nécessite un compte (le Visiteur n'a pas d'historique, cf. CDC)
router.get('/', requireAuth, estimationController.getHistorique);
router.post('/comparer', requireAuth, estimationController.comparerEstimations);
router.get('/:id', requireAuth, estimationController.getEstimationById);
router.delete('/:id', requireAuth, estimationController.supprimerEstimation);
router.get('/:id/export', requireAuth, estimationController.exporterEstimation);

module.exports = router;
