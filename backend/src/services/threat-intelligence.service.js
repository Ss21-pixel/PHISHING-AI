const threatModel = require('../models/threat.model');

const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

async function getThreatIntelligence(filters = {}) {
    const search = String(filters.search || '').trim();
    const severity = String(filters.severity || '').toUpperCase();
    const threatType = String(filters.threatType || '').trim();

    const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
    const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(filters.limit, 10) || 10)
    );

    if (severity && !VALID_SEVERITIES.includes(severity)) {
        const error = new Error('El nivel de gravedad no es válido.');
        error.status = 400;
        throw error;
    }

    const result = await threatModel.findAllThreats({
        search,
        severity,
        threatType,
        page,
        limit
    });

    return result;
}

module.exports = {
    getThreatIntelligence
};
