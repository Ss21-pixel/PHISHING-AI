const { z } = require('zod');

const analysisSchema = z.object({
    analysisType: z.enum(
        ['URL', 'MESSAGE'],
        {
            error: 'El tipo de análisis debe ser URL o MESSAGE'
        }
    ),

    originalContent: z.string()
        .trim()
        .min(5, 'El contenido debe tener al menos 5 caracteres')
        .max(10000, 'El contenido no puede superar los 10000 caracteres')
}).superRefine((data, context) => {

    if (data.analysisType === 'URL') {
        try {
            const parsedUrl = new URL(data.originalContent);

            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                context.addIssue({
                    code: 'custom',
                    path: ['originalContent'],
                    message: 'La URL debe utilizar HTTP o HTTPS'
                });
            }

        } catch {
            context.addIssue({
                code: 'custom',
                path: ['originalContent'],
                message: 'Debes proporcionar una URL válida'
            });
        }
    }
});

module.exports = { analysisSchema };
