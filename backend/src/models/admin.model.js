const { pool } = require('../config/database');

// Obtener estadísticas generales de PHISHING AI
async function getDashboardStats() {
    const [rows] = await pool.execute(`
        SELECT
            (SELECT COUNT(*) FROM users) AS totalUsers,

            (SELECT COUNT(*)
             FROM users
             WHERE is_active = 1) AS activeUsers,

            (SELECT COUNT(*)
             FROM users
             WHERE is_active = 0) AS inactiveUsers,

            (SELECT COUNT(*) FROM analyses) AS totalAnalyses,

            (SELECT COUNT(*)
             FROM analyses
             WHERE risk_level IN ('HIGH', 'CRITICAL')) AS highRiskAnalyses,

            (SELECT COUNT(*) FROM threats) AS totalThreats
    `);

    return rows[0];
}

// Obtener los análisis recientes de todos los usuarios
async function getRecentAnalyses(limit = 10) {
    const [rows] = await pool.execute(`
        SELECT
            a.id,
            a.analysis_type,
            a.risk_level,
            a.risk_score,
            a.status,
            a.created_at,
            u.full_name,
            u.email
        FROM analyses a
        INNER JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
    `, [limit]);

    return rows;
}

module.exports = {
    getDashboardStats,
    getRecentAnalyses
};
