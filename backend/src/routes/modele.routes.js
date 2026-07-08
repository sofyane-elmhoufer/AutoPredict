const express = require('express');
const router = express.Router();
const modeleController = require('../controllers/modele.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, requireRole('ADMINISTRATEUR'), modeleController.listModeles);
router.post('/', requireAuth, requireRole('ADMINISTRATEUR'), modeleController.creerModele);
router.post('/:id/activer', requireAuth, requireRole('ADMINISTRATEUR'), modeleController.activerModele);

module.exports = router;
