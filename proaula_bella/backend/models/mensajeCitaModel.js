const db = require('../config/db');

async function agregar(idCita, autor, texto) {
    const [resultado] = await db.query(
        'INSERT INTO mensajes_cita (id_cita, autor, texto) VALUES (?, ?, ?)',
        [idCita, autor, texto]
    );
    return resultado.insertId;
}

async function mensajesDesde(idCita, desde = 0) {
    const [filas] = await db.query(
        `SELECT id_mensaje AS id, autor, texto, DATE_FORMAT(creado_en, '%H:%i') AS hora
         FROM mensajes_cita WHERE id_cita = ? AND id_mensaje > ? ORDER BY id_mensaje`,
        [idCita, desde]
    );
    return filas;
}

async function marcarLeidos(idCita, autorDelOtro) {
    await db.query(
        'UPDATE mensajes_cita SET leido = TRUE WHERE id_cita = ? AND autor = ? AND leido = FALSE',
        [idCita, autorDelOtro]
    );
}

module.exports = { agregar, mensajesDesde, marcarLeidos };
