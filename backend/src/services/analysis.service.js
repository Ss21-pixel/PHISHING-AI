const { pool } = require('../config/database');

const { createAnalysis } = require('../models/analysis.model');
const { createThreat } = require('../models/threat.model');
const { detectThreats } = require('../detectors/threat.detector');

// Calcular el nivel de riesgo general del análisis
function calculateRisk(threats) {
    const score = Math.min(
        100,
        threats.reduce((total, threat) => total + threat.points, 0)
    );

    let riskLevel = 'LOW';

    if (score >= 75) {
        riskLevel = 'CRITICAL';
    } else if (score >= 50) {
        riskLevel = 'HIGH';
    } else if (score >= 25) {
        riskLevel = 'MEDIUM';
    }

    return { score, riskLevel };
}

// Clasificar la severidad individual de cada amenaza
function calculateThreatSeverity(points) {
    if (points >= 35) {
        return 'CRITICAL';
    }

    if (points >= 25) {
        return 'HIGH';
    }

    if (points >= 15) {
        return 'MEDIUM';
    }

    return 'LOW';
}

// Ejecutar el análisis y guardar sus resultados
async function performAnalysis(userId, data) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Detectar amenazas mediante las reglas internas
        const detectedThreats = detectThreats(
            data.originalContent,
            data.analysisType
        );

        // Calcular el riesgo general
        const { score, riskLevel } = calculateRisk(detectedThreats);

        // Generar resumen del análisis
        const summary = detectedThreats.length > 0
            ? `Se detectaron ${detectedThreats.length} posible(s) amenaza(s).`
            : 'No se detectaron amenazas mediante las reglas internas.';

        // Guardar el análisis principal
        const analysisId = await createAnalysis({
            userId,
            analysisType: data.analysisType,
            originalContent: data.originalContent,
            riskScore: score,
            riskLevel,
            summary
        }, connection);

        // Guardar cada amenaza con su severidad correspondiente
        for (const threat of detectedThreats) {
            const severity = calculateThreatSeverity(threat.points);

            await createThreat({
                analysisId,
                threatType: threat.threatType,
                description: threat.description,
                indicator: threat.indicator,
                severity
            }, connection);
        }

        await connection.commit();

        // Devolver los resultados del análisis
        return {
            analysisId,
            score,
            riskLevel,
            summary,
            threats: detectedThreats.map(threat => ({
                threatType: threat.threatType,
                description: threat.description,
                indicator: threat.indicator,
                points: threat.points,
                severity: calculateThreatSeverity(threat.points)
            }))
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    performAnalysis
};
