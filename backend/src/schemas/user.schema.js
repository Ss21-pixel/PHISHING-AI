const { z } = require('zod');

const registerUserSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(150, 'El nombre no puede superar los 150 caracteres'),

    email: z
        .string()
        .trim()
        .email('Debes proporcionar un correo electrónico válido')
        .max(190, 'El correo es demasiado largo')
        .transform(value => value.toLowerCase()),

    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(72, 'La contraseña no puede superar los 72 caracteres')
});

const loginUserSchema = z.object({
    email: z
        .string()
        .trim()
        .email('Debes proporcionar un correo electrónico válido')
        .max(190, 'El correo es demasiado largo')
        .transform(value => value.toLowerCase()),

    password: z
        .string()
        .min(1, 'La contraseña es obligatoria')
        .max(72, 'La contraseña no puede superar los 72 caracteres'),

    selectedRole: z
        .enum(['USER', 'ADMIN'], {
            errorMap: () => ({
                message: 'Selecciona un tipo de cuenta válido'
            })
        })
});

module.exports = {
    registerUserSchema,
    loginUserSchema
};
