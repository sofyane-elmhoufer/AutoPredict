/**
 * Crée les tables de la base à partir des modèles Sequelize.
 * Usage : npm run db:init
 */
require('dotenv').config();
const { sequelize, testConnection } = require('../src/config/database');
require('../src/models');

(async () => {
  await testConnection();
  await sequelize.sync({ force: false, alter: true });
  console.log('✅ Base de données initialisée à partir des modèles Sequelize.');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur lors de l\'initialisation :', err);
  process.exit(1);
});
