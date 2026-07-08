const jwt = require('jsonwebtoken');

function generateToken(utilisateur) {
  return jwt.sign(
    {
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      role: utilisateur.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
