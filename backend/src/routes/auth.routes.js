const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/error.middleware');
const { registerRules, loginRules } = require('../validators/auth.validator');

router.post('/register', registerRules, handleValidationErrors, authController.register);
router.post('/login', loginRules, handleValidationErrors, authController.login);
router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, authController.updateProfile);
router.delete('/me', requireAuth, authController.deleteAccount);

module.exports = router;
