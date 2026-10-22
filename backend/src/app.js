const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const estimationRoutes = require('./routes/estimation.routes');
const catalogueRoutes = require('./routes/catalogue.routes');
const adminRoutes = require('./routes/admin.routes');
const modeleRoutes = require('./routes/modele.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Sécurité et middlewares globaux
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// On limite le nombre de requêtes par IP pour éviter le spam
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, veuillez réessayer plus tard.' },
});
app.use('/api', apiLimiter);

// Route pour vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AutoPredict API', timestamp: new Date().toISOString() });
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/estimations', estimationRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/modeles', modeleRoutes);

// 404 et gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
