const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true, // colonnes en snake_case en base (id_utilisateur, etc.)
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base MySQL établie avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données :', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
