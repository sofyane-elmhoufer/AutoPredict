const express = require('express');
const router = express.Router();
const estimationController = require('../controllers/estimation.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/error.middleware');
const { estimationRules } = require('../validators/estimation.validator');

// Un visiteur peut estimer un prix (optionalAuth). S'il est connecté, l'estimation
// est ajoutée à son historique.
router.post(
  '/',
  optionalAuth,
  estimationRules,
  handleValidationErrors,
  estimationController.creerEstimation
);

// Le reste demande un compte (un visiteur n'a pas d'historique)
router.get('/', requireAuth, estimationController.getHistorique);
router.post('/comparer', requireAuth, estimationController.comparerEstimations);
router.get('/:id', requireAuth, estimationController.getEstimationById);
router.delete('/:id', requireAuth, estimationController.supprimerEstimation);
router.get('/:id/export', requireAuth, estimationController.exporterEstimation);

module.exports = router;
