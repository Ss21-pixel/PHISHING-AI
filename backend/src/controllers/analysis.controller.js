const { analysisSchema } = require('../schemas/analysis.schema');

const {
    performAnalysis
} = require('../services/analysis.service');

const {
    findAnalysisById,
    findAnalysesByUser
} = require('../models/analysis.model');

const {
    findThreatsByAnalysis
} = require('../models/threat.model');

// Realizar un análisis de phishing
async function analyze(req, res) {
    try {
        const validation = analysisSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Los datos del análisis no son válidos',
                errors: validation.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const result = await performAnalysis(
            req.user.id,
            validation.data
        );

        return res.status(201).json({
            success: true,
            message: 'Análisis realizado correctamente',
            data: result
        });

    } catch (error) {
        console.error('Error al realizar análisis:', error.message);

        return res.status(500).json({
            success: false,
            message: 'No fue posible realizar el análisis'
        });
    }
}

// Consultar historial de análisis
async function history(req, res) {
    try {
        const analyses = await findAnalysesByUser(req.user.id);

        return res.status(200).json({
            success: true,
            message: 'Historial consultado correctamente',
            data: analyses
        });

    } catch (error) {
        console.error('Error al consultar historial:', error.message);

        return res.status(500).json({
            success: false,
            message: 'No fue posible consultar el historial'
        });
    }
}

// Consultar un análisis específico
async function detail(req, res) {
    try {
        const analysisId = req.params.id;

        if (!/^[1-9]\d*$/.test(analysisId)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador del análisis no es válido'
            });
        }

        const analysis = await findAnalysisById(
            analysisId,
            req.user.id
        );

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Análisis no encontrado'
            });
        }

        const threats = await findThreatsByAnalysis(analysisId);

        return res.status(200).json({
            success: true,
            message: 'Análisis consultado correctamente',
            data: {
                ...analysis,
                threats
            }
        });

    } catch (error) {
        console.error('Error al consultar análisis:', error.message);

        return res.status(500).json({
            success: false,
            message: 'No fue posible consultar el análisis'
        });
    }
}

module.exports = {
    analyze,
    history,
    detail
};
