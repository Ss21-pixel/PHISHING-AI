
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // TLS para la conexión segura con TiDB Cloud.
    ssl: process.env.DB_SSL_CA
        ? {
            ca: process.env.DB_SSL_CA,
            minVersion: 'TLSv1.2'
        }
        : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT 1 AS conexion'
        );

        console.log('Conexion a MySQL exitosa:', rows[0]);

        return true;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    testConnection
};
