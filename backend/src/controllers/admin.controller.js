const { Op, fn, col } = require('sequelize');
const { sequelize, Utilisateur, Estimation, ModeleML } = require('../models');
const mlService = require('../services/mlService');
const { toCamelCase } = require('../utils/caseConverter');

/**
 * GET /api/admin/dashboard
 * Chiffres du tableau de bord : utilisateurs, estimations, cache, modèle actif
 * et état du service ML.
 */
async function getDashboard(req, res, next) {
  try {
    const [
      totalUtilisateurs,
      totalEstimations,
      estimationsCache,
      estimationsNouvelles,
      modeleActif,
      mlHealth,
    ] = await Promise.all([
      Utilisateur.count(),
      Estimation.count(),
      Estimation.count({ where: { source_resultat: 'CACHE' } }),
      Estimation.count({ where: { source_resultat: 'NOUVELLE_PREDICTION' } }),
      ModeleML.findOne({ where: { statut_actif: true } }),
      mlService.healthCheck(),
    ]);

    const tauxReutilisationCache =
      totalEstimations > 0 ? Number(((estimationsCache / totalEstimations) * 100).toFixed(2)) : 0;

    // Nombre d'estimations sur les 7 derniers jours
    const septJoursAvant = new Date();
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);
    const estimationsRecentes = await Estimation.count({
      where: { date_estimation: { [Op.gte]: septJoursAvant } },
    });

    res.json({
      utilisateurs: { total: totalUtilisateurs },
      estimations: {
        total: totalEstimations,
        depuisCache: estimationsCache,
        nouvellesPredictions: estimationsNouvelles,
        septDerniersJours: estimationsRecentes,
      },
      cache: { tauxReutilisationPourcent: tauxReutilisationCache },
      modeleActif: modeleActif
        ? {
            idModele: modeleActif.id_modele,
            nomVersion: modeleActif.nom_version,
            algorithme: modeleActif.algorithme,
            scoreR2: modeleActif.score_r2,
            scoreMae: modeleActif.score_mae,
            dateEntrainement: modeleActif.date_entrainement,
          }
        : null,
      serviceML: mlHealth,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/cache/supervision
 * Nombre d'estimations (cache ou nouvelle prédiction) par version du modèle
 * et par jour.
 */
async function superviserCache(req, res, next) {
  try {
    const repartitionParModele = await Estimation.findAll({
      // On écrit "Estimation.id_modele" avec le nom de la table : la jointure
      // contient aussi une colonne id_modele, et sans ça SQL ne sait pas laquelle prendre.
      attributes: [
        [col('Estimation.id_modele'), 'id_modele'],
        'source_resultat',
        [fn('COUNT', col('Estimation.id_estimation')), 'total'],
      ],
      include: [{ model: ModeleML, as: 'modeleUtilise', attributes: ['nom_version'] }],
      group: ['Estimation.id_modele', 'Estimation.source_resultat', 'modeleUtilise.id_modele'],
    });

    const parJour = await Estimation.findAll({
      attributes: [
        [fn('DATE', col('date_estimation')), 'jour'],
        'source_resultat',
        [fn('COUNT', col('id_estimation')), 'total'],
      ],
      group: [fn('DATE', col('date_estimation')), 'source_resultat'],
      order: [[fn('DATE', col('date_estimation')), 'DESC']],
      limit: 60,
    });

    res.json({ repartitionParModele: toCamelCase(repartitionParModele), parJour: toCamelCase(parJour) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/utilisateurs
 */
async function listUtilisateurs(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.q) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${req.query.q}%` } },
        { prenom: { [Op.like]: `%${req.query.q}%` } },
        { email: { [Op.like]: `%${req.query.q}%` } },
      ];
    }

    const { rows, count } = await Utilisateur.findAndCountAll({
      where,
      attributes: { exclude: ['mot_de_passe_hash'] },
      order: [['date_inscription', 'DESC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      utilisateurs: toCamelCase(rows),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/utilisateurs/:id
 * Active ou désactive un compte, ou change son rôle.
 * Body : { statutCompte?: boolean, role?: 'UTILISATEUR'|'ADMINISTRATEUR' }
 */
async function gererUtilisateur(req, res, next) {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id, {
      attributes: { exclude: ['mot_de_passe_hash'] },
    });
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const { statutCompte, role } = req.body;

    if (typeof statutCompte === 'boolean') {
      utilisateur.statut_compte = statutCompte;
    }
    if (role && ['UTILISATEUR', 'ADMINISTRATEUR'].includes(role)) {
      utilisateur.role = role;
    }

    await utilisateur.save();
    res.json({ message: 'Utilisateur mis à jour.', utilisateur: toCamelCase(utilisateur) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, superviserCache, listUtilisateurs, gererUtilisateur };
