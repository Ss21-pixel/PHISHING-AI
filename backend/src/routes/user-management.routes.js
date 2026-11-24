const express = require('express');

const {
    authenticateToken,
    requireAdmin
} = require('../middlewares/auth.middleware');

const {
    getUsers,
    updateStatus
} = require('../controllers/user-management.controller');

const router = express.Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticateToken, requireAdmin);

// Consultar usuarios
router.get('/', getUsers);

// Activar o desactivar un usuario
router.patch('/:id/status', updateStatus);

module.exports = router;
