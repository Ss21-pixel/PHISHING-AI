const threatIntelligenceService = require('../services/threat-intelligence.service');

// Consultar inteligencia de amenazas
async function getThreatIntelligence(req, res, next) {
    try {
        const result = await threatIntelligenceService.getThreatIntelligence(
            req.query
        );

        return res.status(200).json({
            success: true,
            message: 'Inteligencia de amenazas consultada correctamente.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getThreatIntelligence
};
