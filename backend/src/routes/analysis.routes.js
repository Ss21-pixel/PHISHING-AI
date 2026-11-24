const express = require('express');
const router = express.Router();

const {
    analyze,
    history,
    detail
} = require('../controllers/analysis.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/analyses
router.post('/', analyze);

// GET /api/analyses
router.get('/', history);

// GET /api/analyses/:id
router.get('/:id', detail);

module.exports = router;
