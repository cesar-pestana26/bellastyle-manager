const db = require('../config/db');

const SELECT_CITAS = `
    SELECT c.id_cita AS id,
           c.id_estilista,
           c.id_servicio,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
           CONCAT(e.nombres, ' ', e.apellidos) AS estilista,
           s.nombre AS servicio,
           c.precio,
           DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
           TIME_FORMAT(c.hora, '%H:%i') AS hora,
           c.estado,
           c.observaciones,
           c.notas_servicio,
           c.reprogramaciones,
           c.id_cliente,
           cl.profesion,
           (SELECT cal.estrellas FROM calificaciones cal WHERE cal.id_cita = c.id_cita) AS calificacion,
           (SELECT COUNT(*) FROM mensajes_cita m
             WHERE m.id_cita = c.id_cita AND m.autor = 'Estilista' AND m.leido = FALSE) AS sin_leer_clienta,
           (SELECT COUNT(*) FROM mensajes_cita m
             WHERE m.id_cita = c.id_cita AND m.autor = 'Clienta' AND m.leido = FALSE) AS sin_leer_estilista
    FROM citas c
    JOIN clientas cl ON cl.id_clienta = c.id_cliente
    JOIN estilistas e ON e.id_estilista = c.id_estilista
    JOIN servicios s ON s.id_servicio = c.id_servicio`;

const ORDEN = 'ORDER BY c.fecha DESC, c.hora DESC';

async function listarTodas() {
    const [filas] = await db.query(`${SELECT_CITAS} ${ORDEN}`);
    return filas;
}

async function listarPorEstilista(idUsuario) {
    const [filas] = await db.query(`${SELECT_CITAS} WHERE e.id_usuario = ? ${ORDEN}`, [idUsuario]);
    return filas;
}

async function listarPorClienta(idUsuario) {
    const [filas] = await db.query(`${SELECT_CITAS} WHERE cl.id_usuario = ? ${ORDEN}`, [idUsuario]);
    return filas;
}

async function buscarPorId(idCita) {
    const [filas] = await db.query(`
        SELECT c.id_cita, c.id_cliente, c.id_estilista, c.id_servicio, c.estado, c.reprogramaciones,
               cl.id_usuario AS id_usuario_clienta, s.duracion_min
        FROM citas c
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

async function ocupadasDelDia(idEstilista, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora, s.duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idEstilista, fecha, excluirId]);
    return filas;
}

async function ocupadasClientaDelDia(idClienta, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora, s.duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cliente = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idClienta, fecha, excluirId]);
    return filas;
}

async function crear(conexion, { idClienta, idEstilista, idServicio, fecha, hora, precio, observaciones }) {
    const [resultado] = await (conexion || db).query(
        `INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, precio, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [idClienta, idEstilista, idServicio, fecha, hora, precio, observaciones || null]
    );
    return resultado.insertId;
}

async function cambiarEstado(idCita, estado) {
    const [resultado] = await db.query('UPDATE citas SET estado = ? WHERE id_cita = ?', [estado, idCita]);
    return resultado.affectedRows > 0;
}

async function reprogramar(idCita, fecha, hora) {
    await db.query("UPDATE citas SET fecha = ?, hora = ?, estado = 'Pendiente', reprogramaciones = reprogramaciones + 1 WHERE id_cita = ?", [fecha, hora, idCita]);
}

async function guardarNotas(idCita, notas) {
    const [resultado] = await db.query('UPDATE citas SET notas_servicio = ? WHERE id_cita = ?', [notas || null, idCita]);
    return resultado.affectedRows > 0;
}

async function detalle(idCita) {
    const [filas] = await db.query(`${SELECT_CITAS.replace('c.precio,', 'c.precio, s.duracion_min, cl.telefono, cl.email,')} WHERE c.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

async function buscarParticipantes(idCita) {
    const [filas] = await db.query(`
        SELECT c.id_cita, c.estado, c.id_estilista,
               cl.id_usuario AS id_usuario_clienta,
               e.id_usuario AS id_usuario_estilista,
               CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
               CONCAT(e.nombres, ' ', e.apellidos) AS estilista,
               s.nombre AS servicio,
               DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
               TIME_FORMAT(c.hora, '%H:%i') AS hora
        FROM citas c
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN estilistas e ON e.id_estilista = c.id_estilista
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

module.exports = {
    buscarParticipantes,
    listarTodas, listarPorEstilista, listarPorClienta, buscarPorId,
    ocupadasDelDia, ocupadasClientaDelDia, crear, cambiarEstado, reprogramar, guardarNotas, detalle
};
