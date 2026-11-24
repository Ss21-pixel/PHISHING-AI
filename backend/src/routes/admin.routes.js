const express = require('express');
const router = express.Router();

const { getDashboard } = require('../controllers/admin.controller');

const {
    authenticateToken,
    requireAdmin
} = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, requireAdmin);

// Consultar información del panel administrativo
router.get('/dashboard', getDashboard);

module.exports = router;