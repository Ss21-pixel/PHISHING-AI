const express = require('express');
const router = express.Router();

const {
    authenticateToken,
    requireAdmin
} = require('../middlewares/auth.middleware');

const {
    getThreatIntelligence
} = require('../controllers/threat-intelligence.controller');

// Proteger todas las rutas de este módulo
router.use(authenticateToken, requireAdmin);

// Consultar amenazas con filtros
router.get('/', getThreatIntelligence);

module.exports = router;
