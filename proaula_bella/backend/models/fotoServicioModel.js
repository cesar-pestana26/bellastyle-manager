const db = require('../config/db');

const MAX_POR_SERVICIO = 6;

async function listar(idServicio) {
    const sql = idServicio
        ? 'SELECT id_foto, id_servicio FROM fotos_servicio WHERE id_servicio = ? ORDER BY id_foto'
        : 'SELECT f.id_foto, f.id_servicio, s.nombre AS servicio FROM fotos_servicio f JOIN servicios s ON s.id_servicio = f.id_servicio ORDER BY f.id_servicio, f.id_foto';
    const [filas] = await db.query(sql, idServicio ? [idServicio] : []);
    return filas;
}

async function contar(idServicio) {
    const [filas] = await db.query('SELECT COUNT(*) AS total FROM fotos_servicio WHERE id_servicio = ?', [idServicio]);
    return filas[0].total;
}

async function crear(idServicio, foto) {
    const [resultado] = await db.query(
        'INSERT INTO fotos_servicio (id_servicio, tipo, datos, url, public_id) VALUES (?, ?, ?, ?, ?)',
        [idServicio, foto.tipo, foto.datos, foto.url, foto.publicId]
    );
    return resultado.insertId;
}

async function buscar(idFoto) {
    const [filas] = await db.query('SELECT tipo, datos, url, public_id FROM fotos_servicio WHERE id_foto = ?', [idFoto]);
    return filas[0] || null;
}

async function eliminar(idFoto) {
    const [resultado] = await db.query('DELETE FROM fotos_servicio WHERE id_foto = ?', [idFoto]);
    return resultado.affectedRows > 0;
}

module.exports = { listar, contar, crear, buscar, eliminar, MAX_POR_SERVICIO };
