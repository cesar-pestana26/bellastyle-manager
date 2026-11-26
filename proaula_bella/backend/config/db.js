const mysql = require('mysql2');
const config = require('./config');

const pool = mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10
});

pool.on('connection', (conexion) => {
    conexion.query("SET time_zone = '-05:00'");
});

module.exports = pool.promise();
