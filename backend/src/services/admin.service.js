const adminModel = require('../models/admin.model');

// Obtener toda la información del panel administrativo
async function getDashboardData() {
    const [stats, recentAnalyses] = await Promise.all([
        adminModel.getDashboardStats(),
        adminModel.getRecentAnalyses(10)
    ]);

    return {
        stats,
        recentAnalyses
    };
}

module.exports = {
    getDashboardData
};