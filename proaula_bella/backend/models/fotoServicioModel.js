// Modelo de la tabla fotos_servicio: fotos que la administradora sube para cada servicio.
// La imagen se guarda DENTRO de la base de datos (columna MEDIUMBLOB) y no en una carpeta,
// porque en servidores gratis (Render, Railway) los archivos subidos se borran
// cada vez que el servidor se reinicia; la base de datos (Aiven) sí los conserva.
const db = require('../config/db');

const MAX_POR_SERVICIO = 6;

// Lista sin la imagen (solo ids), para armar las direcciones /api/fotos/:id
async function listar(idServicio) {
    const sql = idServicio
        ? 'SELECT id_foto, id_servicio FROM fotos_servicio WHERE id_servicio = ? ORDER BY id_foto'
        : 'SELECT id_foto, id_servicio FROM fotos_servicio ORDER BY id_servicio, id_foto';
    const [filas] = await db.query(sql, idServicio ? [idServicio] : []);
    return filas;
}

async function contar(idServicio) {
    const [filas] = await db.query('SELECT COUNT(*) AS total FROM fotos_servicio WHERE id_servicio = ?', [idServicio]);
    return filas[0].total;
}

async function crear(idServicio, tipo, datos) {
    const [resultado] = await db.query(
        'INSERT INTO fotos_servicio (id_servicio, tipo, datos) VALUES (?, ?, ?)', [idServicio, tipo, datos]
    );
    return resultado.insertId;
}

async function buscar(idFoto) {
    const [filas] = await db.query('SELECT tipo, datos FROM fotos_servicio WHERE id_foto = ?', [idFoto]);
    return filas[0] || null;
}

async function eliminar(idFoto) {
    const [resultado] = await db.query('DELETE FROM fotos_servicio WHERE id_foto = ?', [idFoto]);
    return resultado.affectedRows > 0;
}

module.exports = { listar, contar, crear, buscar, eliminar, MAX_POR_SERVICIO };
