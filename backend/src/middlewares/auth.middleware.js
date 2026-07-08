const { verifyToken } = require('../utils/jwt');
const { Utilisateur } = require('../models');

/**
 * Exige une authentification valide. À utiliser sur les routes réservées
 * aux Utilisateurs connectés (historique, comparaison, export, profil...).
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
 * Authentification optionnelle : permet au Visiteur d'accéder à la route
 * (ex. estimation de prix), mais attache req.user si un token valide est fourni.
 * Nécessaire car le Visiteur peut estimer un prix sans compte (cf. cas d'utilisation).
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
    req.user = null; // token invalide -> traité comme Visiteur, pas d'erreur bloquante
    next();
  }
}

/**
 * Restreint l'accès à un ou plusieurs rôles (ex. requireRole('ADMINISTRATEUR')).
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
