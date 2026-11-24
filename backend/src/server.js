
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth.routes');
const analysisRoutes = require('./routes/analysis.routes');
const adminRoutes = require('./routes/admin.routes');
const threatIntelligenceRoutes = require('./routes/threat-intelligence.routes');

// NUEVO: rutas de gestión de usuarios
const userManagementRoutes = require('./routes/user-management.routes');

const app = express();

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

app.use(helmet());

const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origen no permitido por CORS'));
    }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// LÍMITE DE SOLICITUDES
// ==========================================

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false
});

app.use('/api', limiter);

// ==========================================
// RUTAS PRINCIPALES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/threat-intelligence', threatIntelligenceRoutes);

// NUEVO: GESTIÓN DE USUARIOS
app.use('/api/admin/users', userManagementRoutes);

// ==========================================
// INFORMACIÓN DE LA API
// ==========================================

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API PHISHING AI funcionando correctamente',
        version: '1.0.0'
    });
});

// ==========================================
// ESTADO DEL SERVIDOR
// ==========================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor operativo',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// ESTADO DE LA BASE DE DATOS
// ==========================================

app.get('/api/health/db', async (req, res) => {
    try {
        await testConnection();

        return res.status(200).json({
            success: true,
            message: 'Conexión con MySQL establecida correctamente',
            database: process.env.DB_NAME
        });

    } catch (error) {
        console.error('Error de conexión MySQL:', error.message);

        return res.status(503).json({
            success: false,
            message: 'No se pudo establecer conexión con la base de datos'
        });
    }
});

// ==========================================
// RUTA NO ENCONTRADA
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'La ruta solicitada no existe'
    });
});

// ==========================================
// MANEJO GENERAL DE ERRORES
// ==========================================

app.use((error, req, res, next) => {
    console.error('Error del servidor:', error.message);

    res.status(error.status || error.statusCode || 500).json({
        success: false,
        message: error.statusCode
            ? error.message
            : 'Error interno del servidor'
    });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('====================================');
    console.log('       PHISHING AI - BACKEND');
    console.log('====================================');
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
});
