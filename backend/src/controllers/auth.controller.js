const {
    registerUserSchema,
    loginUserSchema
} = require('../schemas/user.schema');

const {
    registerUser,
    loginUser,
    getUserProfile
} = require('../services/auth.service');

// REGISTRO DE USUARIOS
async function register(req, res) {
    try {
        const validation = registerUserSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Los datos proporcionados no son válidos',
                errors: validation.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const result = await registerUser(validation.data);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            data: result
        });

    } catch (error) {
        console.error('Error en registro:', error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : 'Error interno al registrar el usuario'
        });
    }
}

// INICIO DE SESIÓN
async function login(req, res) {
    try {
        const validation = loginUserSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Los datos de acceso no son válidos',
                errors: validation.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const result = await loginUser(validation.data);

        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: result
        });

    } catch (error) {
        console.error('Error en inicio de sesión:', error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : 'Error interno al iniciar sesión'
        });
    }
}

// PERFIL DEL USUARIO AUTENTICADO
async function profile(req, res) {
    try {
        const user = await getUserProfile(req.user.id);

        return res.status(200).json({
            success: true,
            message: 'Perfil consultado correctamente',
            data: user
        });

    } catch (error) {
        console.error('Error al consultar perfil:', error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : 'Error interno al consultar el perfil'
        });
    }
}

module.exports = {
    register,
    login,
    profile
};

