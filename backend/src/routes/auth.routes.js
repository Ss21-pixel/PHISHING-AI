const express = require('express');

const router = express.Router();

const {
    register,
    login,
    profile
} = require('../controllers/auth.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

// Registrar una cuenta
router.post('/register', register);

// Iniciar sesión
router.post('/login', login);

// Consultar perfil (requiere JWT)
router.get('/profile', authenticateToken, profile);

module.exports = router;
