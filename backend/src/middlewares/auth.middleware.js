const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/user.model');

// Verificar token y comprobar que la cuenta siga activa
async function authenticateToken(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Debes iniciar sesión para acceder a este recurso'
            });
        }

        const token = authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no está configurado');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await findUserById(decoded.sub);

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'La cuenta no existe o se encuentra desactivada'
            });
        }

        // El rol se obtiene de MySQL, no del token
        req.user = {
            id: user.id,
            role: user.role
        };

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Tu sesión ha expirado. Inicia sesión nuevamente'
            });
        }

        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o no autorizado'
            });
        }

        console.error('Error de autenticación:', error.message);

        return res.status(500).json({
            success: false,
            message: 'No se pudo verificar la autenticación'
        });
    }
}

// Permitir el acceso exclusivamente a administradores
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Debes iniciar sesión'
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos de administrador'
        });
    }

    return next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
