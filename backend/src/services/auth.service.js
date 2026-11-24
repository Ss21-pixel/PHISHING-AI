const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
    findUserByEmail,
    findUserById,
    createUser
} = require('../models/user.model');

// Generar un token JWT usando el rol real de MySQL
function generateToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign(
        {
            sub: String(user.id),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
}

// Registrar un usuario.
// El modelo asigna USER directamente; nunca se recibe ADMIN del formulario.
async function registerUser(data) {
    const existingUser = await findUserByEmail(data.email);

    if (existingUser) {
        const error = new Error('El correo electrónico ya está registrado');
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const userId = await createUser({
        fullName: data.fullName,
        email: data.email,
        passwordHash
    });

    const user = await findUserById(userId);

    if (!user) {
        throw new Error('No fue posible recuperar el usuario registrado');
    }

    const token = generateToken(user);

    return {
        user,
        token
    };
}

// Iniciar sesión
async function loginUser(data) {
    const user = await findUserByEmail(data.email);

    if (!user) {
        const error = new Error('Correo o contraseña incorrectos');
        error.statusCode = 401;
        throw error;
    }

    if (!user.is_active) {
        const error = new Error('La cuenta se encuentra desactivada');
        error.statusCode = 403;
        throw error;
    }

    // Comprobar la contraseña
    const passwordCorrect = await bcrypt.compare(
        data.password,
        user.password_hash
    );

    if (!passwordCorrect) {
        const error = new Error('Correo o contraseña incorrectos');
        error.statusCode = 401;
        throw error;
    }

    // Validar que el tipo seleccionado coincida con el rol real de MySQL
    if (!['USER', 'ADMIN'].includes(data.selectedRole)) {
        const error = new Error('Debes seleccionar un tipo de cuenta válido');
        error.statusCode = 400;
        throw error;
    }

    if (user.role !== data.selectedRole) {
        const error = new Error(
            'El tipo de cuenta seleccionado no corresponde a esta cuenta.'
        );
        error.statusCode = 403;
        throw error;
    }

    // El token utiliza exclusivamente el rol almacenado en MySQL
    const token = generateToken(user);

    return {
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        },
        token
    };
}

// Obtener perfil del usuario autenticado
async function getUserProfile(userId) {
    const user = await findUserById(userId);

    if (!user || !user.is_active) {
        const error = new Error('Usuario no encontrado o desactivado');
        error.statusCode = 404;
        throw error;
    }

    return user;
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};
