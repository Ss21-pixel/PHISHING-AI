
const { pool } = require('../config/database');

// Registrar una amenaza detectada
async function createThreat(threat, connection = pool) {
    const [result] = await connection.execute(
        `INSERT INTO threats
        (analysis_id, threat_type, description, indicator, severity)
        VALUES (?, ?, ?, ?, ?)`,
        [
            threat.analysisId,
            threat.threatType,
            threat.description || null,
            threat.indicator || null,
            threat.severity || 'MEDIUM'
        ]
    );

    return result.insertId;
}

// Consultar amenazas asociadas a un análisis
async function findThreatsByAnalysis(analysisId) {
    const [rows] = await pool.execute(
        `SELECT id, analysis_id, threat_type, description,
                indicator, severity, created_at
         FROM threats
         WHERE analysis_id = ?
         ORDER BY created_at DESC`,
        [analysisId]
    );

    return rows;
}

// Consultar amenazas con filtros y paginación
async function findAllThreats({
    search = '',
    severity = '',
    threatType = '',
    page = 1,
    limit = 10
} = {}) {
    const offset = (page - 1) * limit;

    let sql = `
        SELECT
            t.id,
            t.analysis_id,
            t.threat_type,
            t.description,
            t.indicator,
            t.severity,
            t.created_at,
            a.user_id
        FROM threats t
        INNER JOIN analyses a ON a.id = t.analysis_id
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {
        sql += ` AND (
            t.indicator LIKE ?
            OR t.description LIKE ?
            OR t.threat_type LIKE ?
        )`;

        const term = `%${search}%`;
        params.push(term, term, term);
    }

    if (severity) {
        sql += ' AND t.severity = ?';
        params.push(severity);
    }

    if (threatType) {
        sql += ' AND t.threat_type = ?';
        params.push(threatType);
    }

    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.execute(sql, params);

    let countSql = `
        SELECT COUNT(*) AS total
        FROM threats t
        INNER JOIN analyses a ON a.id = t.analysis_id
        WHERE 1 = 1
    `;

    const countParams = [];

    if (search) {
        countSql += ` AND (
            t.indicator LIKE ?
            OR t.description LIKE ?
            OR t.threat_type LIKE ?
        )`;

        const term = `%${search}%`;
        countParams.push(term, term, term);
    }

    if (severity) {
        countSql += ' AND t.severity = ?';
        countParams.push(severity);
    }

    if (threatType) {
        countSql += ' AND t.threat_type = ?';
        countParams.push(threatType);
    }

    const [countRows] = await pool.execute(countSql, countParams);

    return {
        threats: rows,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countRows[0].total,
            totalPages: Math.ceil(countRows[0].total / limit)
        }
    };
}

module.exports = {
    createThreat,
    findThreatsByAnalysis,
    findAllThreats
};
