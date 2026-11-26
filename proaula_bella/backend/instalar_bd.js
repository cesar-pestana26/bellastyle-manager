const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function instalar() {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'init_db.sql'), 'utf8');

    const conexion = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl,
        multipleStatements: true
    });

    await conexion.query(sql);
    const [usuarios] = await conexion.query('SELECT username, rol FROM bellastylemanager.usuarios');
    await conexion.end();

    console.log('Base de datos creada correctamente. Usuarios de prueba:');
    usuarios.forEach((u) => console.log(`  - ${u.username} (${u.rol})`));
}

instalar().catch((err) => {
    console.error('No se pudo crear la base de datos:', err.message);
    console.error('Revisa usuario y contraseña de MySQL en backend/config/config.js');
    process.exit(1);
});
