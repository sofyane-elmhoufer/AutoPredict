require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
require('./src/models'); // charge les modèles et leurs relations

const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();

  // Seulement en développement : on crée/met à jour les tables automatiquement.
  // En production, mieux vaut utiliser le script database/schema.sql.
  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: true });
    console.log('🔄 Modèles synchronisés avec la base de données (mode développement).');
  }

  app.listen(PORT, () => {
    console.log(`🚀 AutoPredict API démarrée sur le port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start().catch((err) => {
  console.error('❌ Échec du démarrage du serveur :', err);
  process.exit(1);
});
