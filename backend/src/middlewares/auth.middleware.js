const { verifyToken } = require('../utils/jwt');
const { Utilisateur } = require('../models');

/**
 * Vérifie qu'un token valide est fourni. Pour les routes réservées aux
 * utilisateurs connectés (historique, comparaison, export, profil).
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentification requise. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const utilisateur = await Utilisateur.findByPk(decoded.id);
    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }
    if (!utilisateur.statut_compte) {
      return res.status(403).json({ message: 'Ce compte a été désactivé par un administrateur.' });
    }

    req.user = {
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      role: utilisateur.role,
      droits_acces: utilisateur.droits_acces,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

/**
 * Authentification optionnelle : un visiteur peut accéder à la route (par
 * exemple pour estimer un prix) mais, s'il envoie un token valide, on
 * remplit req.user pour rattacher l'estimation à son compte.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const utilisateur = await Utilisateur.findByPk(decoded.id);

    req.user = utilisateur && utilisateur.statut_compte
      ? {
          id: utilisateur.id_utilisateur,
          email: utilisateur.email,
          role: utilisateur.role,
          droits_acces: utilisateur.droits_acces,
        }
      : null;
    next();
  } catch (err) {
    req.user = null; // token invalide : on le traite comme un visiteur
    next();
  }
}

/**
 * Limite l'accès à certains rôles, par exemple requireRole('ADMINISTRATEUR').
 */
function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : privilèges insuffisants.' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
