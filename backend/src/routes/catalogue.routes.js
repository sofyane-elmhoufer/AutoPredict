const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogue.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Lecture publique (le formulaire en a besoin, même pour un visiteur)
router.get('/domaine', catalogueController.getDomaineEntrainement);
router.get('/marques', catalogueController.getMarques);
router.get('/modeles', catalogueController.getModelesByMarque);
router.get('/', catalogueController.getCatalogue);

// Modification réservée à l'administrateur
router.post('/', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.ajouterReference);
router.put('/:id', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.modifierReference);
router.delete('/:id', requireAuth, requireRole('ADMINISTRATEUR'), catalogueController.supprimerReference);

module.exports = router;
