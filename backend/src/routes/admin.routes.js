const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Toutes les routes de ce fichier sont réservées à l'ADMINISTRATEUR
router.use(requireAuth, requireRole('ADMINISTRATEUR'));

router.get('/dashboard', adminController.getDashboard);
router.get('/cache/supervision', adminController.superviserCache);
router.get('/utilisateurs', adminController.listUtilisateurs);
router.patch('/utilisateurs/:id', adminController.gererUtilisateur);

module.exports = router;
