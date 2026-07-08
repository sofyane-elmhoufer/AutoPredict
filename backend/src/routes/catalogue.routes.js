const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogue.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Lecture publique (formulaire dynamique accessible au Visiteur)
router.get('/marques', catalogueController.getMarques);
router.get('/modeles', catalogueController.getModelesByMarque);
router.get('/', catalogueController.getCatalogue);

// Écriture réservée à l'administrateur
router.post('/', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.ajouterReference);
router.put('/:id', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.modifierReference);
router.delete('/:id', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.supprimerReference);

module.exports = router;
