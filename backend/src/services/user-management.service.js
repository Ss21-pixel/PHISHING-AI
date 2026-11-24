const {
    findAllUsers,
    findUserById,
    updateUserStatus
} = require('../models/user.model');

// Consultar y filtrar usuarios
async function listUsers(filters = {}) {
    const search = String(filters.search || '').trim();

    const role = String(filters.role || '')
        .trim()
        .toUpperCase();

    const status = String(filters.status ?? '').trim();

    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 10);

    if (search.length > 150) {
        const error = new Error('La búsqueda no puede superar 150 caracteres');
        error.statusCode = 400;
        throw error;
    }

    if (role && !['USER', 'ADMIN'].includes(role)) {
        const error = new Error('El rol seleccionado no es válido');
        error.statusCode = 400;
        throw error;
    }

    if (status && !['0', '1'].includes(status)) {
        const error = new Error('El estado seleccionado no es válido');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(page) || page < 1) {
        const error = new Error('El número de página no es válido');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        const error = new Error('El límite debe estar entre 1 y 100');
        error.statusCode = 400;
        throw error;
    }

    return findAllUsers({
        search,
        role,
        status,
        page,
        limit
    });
}

// Activar o desactivar una cuenta
async function changeUserStatus(userId, isActive, requesterId) {
    const id = Number(userId);
    const currentUserId = Number(requesterId);

    if (!Number.isInteger(id) || id < 1) {
        const error = new Error('El identificador del usuario no es válido');
        error.statusCode = 400;
        throw error;
    }

    if (typeof isActive !== 'boolean') {
        const error = new Error('Debes indicar un estado válido');
        error.statusCode = 400;
        throw error;
    }

    if (!isActive && id === currentUserId) {
        const error = new Error('No puedes desactivar tu propia cuenta');
        error.statusCode = 403;
        throw error;
    }

    const existingUser = await findUserById(id);

    if (!existingUser) {
        const error = new Error('El usuario no existe');
        error.statusCode = 404;
        throw error;
    }

    await updateUserStatus(id, isActive);

    return findUserById(id);
}

module.exports = {
    listUsers,
    changeUserStatus
};
