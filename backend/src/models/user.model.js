const { pool } = require('../config/database');

// Buscar un usuario por su correo electrónico
async function findUserByEmail(email) {
    const [rows] = await pool.execute(
        `SELECT id, full_name, email, password_hash, role, is_active
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0] || null;
}

// Buscar un usuario por su identificador
async function findUserById(id) {
    const [rows] = await pool.execute(
        `SELECT id, full_name, email, role, is_active, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

// Registrar un nuevo usuario: siempre con rol USER
async function createUser(user) {
    const [result] = await pool.execute(
        `INSERT INTO users
         (full_name, email, password_hash, role)
         VALUES (?, ?, ?, ?)`,
        [
            user.fullName,
            user.email,
            user.passwordHash,
            'USER'
        ]
    );

    return result.insertId;
}

// Consultar usuarios para el panel de administración
async function findAllUsers({
    search = '',
    role = '',
    status = '',
    page = 1,
    limit = 10
} = {}) {
    const conditions = [];
    const params = [];

    if (search) {
        conditions.push('(full_name LIKE ? OR email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
        conditions.push('role = ?');
        params.push(role);
    }

    if (status !== '') {
        conditions.push('is_active = ?');
        params.push(Number(status));
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const offset = (page - 1) * limit;

    const [users] = await pool.execute(
        `SELECT id, full_name, email, role, is_active, created_at
         FROM users
         ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM users
         ${where}`,
        params
    );

    return {
        users,
        pagination: {
            total: countRows[0].total,
            page,
            limit,
            totalPages: Math.ceil(countRows[0].total / limit)
        }
    };
}

// Cambiar el estado de una cuenta
async function updateUserStatus(userId, isActive) {
    const [result] = await pool.execute(
        `UPDATE users
         SET is_active = ?
         WHERE id = ?`,
        [isActive ? 1 : 0, userId]
    );

    return result.affectedRows > 0;
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    findAllUsers,
    updateUserStatus
};
