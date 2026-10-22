const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Utilisateur } = require('../models');
const { generateToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 * Création d'un compte.
 */
async function register(req, res, next) {
  try {
    const { nom, prenom, email, motDePasse } = req.body;

    const existant = await Utilisateur.findOne({ where: { email: email.toLowerCase() } });
    if (existant) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 12);

    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email: email.toLowerCase(),
      mot_de_passe_hash: motDePasseHash,
      role: 'UTILISATEUR',
      statut_compte: true,
    });

    const token = generateToken(utilisateur);

    res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      utilisateur: toPublicUser(utilisateur),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Connexion : renvoie un token JWT.
 */
async function login(req, res, next) {
  try {
    const { email, motDePasse } = req.body;

    const utilisateur = await Utilisateur.findOne({ where: { email: email.toLowerCase() } });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!utilisateur.statut_compte) {
      return res.status(403).json({ message: 'Ce compte a été désactivé. Contactez un administrateur.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(utilisateur);

    res.json({
      message: 'Connexion réussie.',
      token,
      utilisateur: toPublicUser(utilisateur),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Profil de l'utilisateur connecté.
 */
async function me(req, res, next) {
  try {
    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ utilisateur: toPublicUser(utilisateur) });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/me
 * Modification du profil.
 */
async function updateProfile(req, res, next) {
  try {
    const { nom, prenom, motDePasse } = req.body;
    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    if (nom) utilisateur.nom = nom;
    if (prenom) utilisateur.prenom = prenom;
    if (motDePasse) {
      if (motDePasse.length < 8) {
        return res.status(422).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      utilisateur.mot_de_passe_hash = await bcrypt.hash(motDePasse, 12);
    }
    await utilisateur.save();

    res.json({ message: 'Profil mis à jour.', utilisateur: toPublicUser(utilisateur) });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/auth/me
 * Suppression du compte.
 */
async function deleteAccount(req, res, next) {
  try {
    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // On anonymise le compte au lieu de le supprimer, pour garder l'historique des estimations
    utilisateur.email = `anonyme_${utilisateur.id_utilisateur}_${Date.now()}@deleted.local`;
    utilisateur.nom = 'Compte supprimé';
    utilisateur.prenom = '';
    utilisateur.statut_compte = false;
    utilisateur.mot_de_passe_hash = await bcrypt.hash(crypto.randomUUID(), 12);
    await utilisateur.save();

    res.json({ message: 'Compte supprimé.' });
  } catch (err) {
    next(err);
  }
}

function toPublicUser(u) {
  return {
    idUtilisateur: u.id_utilisateur,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    role: u.role,
    dateInscription: u.date_inscription,
  };
}

module.exports = { register, login, me, updateProfile, deleteAccount };
