const {
    listUsers,
    changeUserStatus
} = require('../services/user-management.service');

// Consultar usuarios
async function getUsers(req, res, next) {
    try {
        const result = await listUsers(req.query);

        return res.status(200).json({
            success: true,
            message: 'Usuarios consultados correctamente.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

// Cambiar el estado de un usuario
async function updateStatus(req, res, next) {
    try {
        const { isActive } = req.body;

        const user = await changeUserStatus(
            req.params.id,
            isActive,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: isActive
                ? 'Usuario activado correctamente.'
                : 'Usuario desactivado correctamente.',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUsers,
    updateStatus
};
