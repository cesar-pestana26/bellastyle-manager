// Modelo de la tabla clientas
const db = require('../config/db');

async function crear(conexion, { idUsuario, nombres, apellidos, telefono, email, profesion }) {
    const [resultado] = await conexion.query(
        'INSERT INTO clientas (id_usuario, nombres, apellidos, telefono, email, profesion) VALUES (?, ?, ?, ?, ?, ?)',
        [idUsuario, nombres, apellidos, telefono || null, email || null, profesion || null]
    );
    return resultado.insertId;
}

async function buscarPorUsuario(idUsuario) {
    const [filas] = await db.query('SELECT * FROM clientas WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

async function listar() {
    const [filas] = await db.query('SELECT * FROM clientas ORDER BY nombres');
    return filas;
}

async function actualizar(idClienta, { nombres, apellidos, telefono, email, profesion }) {
    const [resultado] = await db.query(
        'UPDATE clientas SET nombres = ?, apellidos = ?, telefono = ?, email = ?, profesion = ? WHERE id_clienta = ?',
        [nombres, apellidos, telefono || null, email || null, profesion || null, idClienta]
    );
    return resultado.affectedRows > 0;
}

// Historial de servicios de una clienta: citas finalizadas, la más reciente primero.
// Lo usa la estilista para saber qué le hicieron la vez pasada.
async function historial(idClienta) {
    const [filas] = await db.query(`
        SELECT c.id_cita AS id, DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha, s.nombre AS servicio,
               CONCAT(e.nombres, ' ', e.apellidos) AS estilista, c.observaciones, c.notas_servicio,
               (SELECT cal.estrellas FROM calificaciones cal WHERE cal.id_cita = c.id_cita) AS calificacion
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        JOIN estilistas e ON e.id_estilista = c.id_estilista
        WHERE c.id_cliente = ? AND c.estado = 'Finalizada'
        ORDER BY c.fecha DESC, c.hora DESC`, [idClienta]);
    return filas;
}

async function buscarPorId(idClienta) {
    const [filas] = await db.query('SELECT * FROM clientas WHERE id_clienta = ?', [idClienta]);
    return filas[0] || null;
}

module.exports = { crear, buscarPorUsuario, buscarPorId, listar, actualizar, historial };
