const { pool } = require('../config/database');

// Crear un nuevo análisis
async function createAnalysis(analysis, connection = pool) {
    const [result] = await connection.execute(
        `INSERT INTO analyses
        (user_id, analysis_type, original_content, risk_level,
         risk_score, status, result_summary)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            analysis.userId,
            analysis.analysisType,
            analysis.originalContent,
            analysis.riskLevel || 'LOW',
            analysis.riskScore ?? 0,
            analysis.status || 'PENDING',
            analysis.resultSummary || null
        ]
    );

    return result.insertId;
}

// Buscar un análisis por identificador y usuario
async function findAnalysisById(id, userId) {
    const [rows] = await pool.execute(
        `SELECT id, user_id, analysis_type, original_content,
                risk_level, risk_score, status, result_summary, created_at
         FROM analyses
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [id, userId]
    );

    return rows[0] || null;
}

// Consultar historial de análisis
async function findAnalysesByUser(userId) {
    const [rows] = await pool.execute(
        `SELECT id, analysis_type, original_content, risk_level,
                risk_score, status, result_summary, created_at
         FROM analyses
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

    return rows;
}

module.exports = {
    createAnalysis,
    findAnalysisById,
    findAnalysesByUser
};
