const adminService = require('../services/admin.service');

// Consultar información del panel administrativo
async function getDashboard(req, res, next) {
    try {
        const data = await adminService.getDashboardData();

        return res.status(200).json({
            success: true,
            message: 'Información del panel administrativo obtenida correctamente',
            data
        });

    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getDashboard
};