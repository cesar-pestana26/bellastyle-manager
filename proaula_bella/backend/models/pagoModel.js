// Modelo de la tabla pagos (transacciones asociadas a una cita)
const db = require('../config/db');

async function buscarPorCita(idCita) {
    const [filas] = await db.query(`
        SELECT p.id_pago, p.id_cita, p.referencia, p.metodo, p.monto, p.estado,
               DATE_FORMAT(p.fecha_pago, '%Y-%m-%d %H:%i') AS fecha_pago,
               DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha_cita,
               TIME_FORMAT(c.hora, '%H:%i') AS hora_cita,
               s.nombre AS servicio,
               CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
               CONCAT(e.nombres, ' ', e.apellidos) AS estilista
        FROM pagos p
        JOIN citas c ON c.id_cita = p.id_cita
        JOIN servicios s ON s.id_servicio = c.id_servicio
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN estilistas e ON e.id_estilista = c.id_estilista
        WHERE p.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

async function listar({ rol, idUsuario }) {
    let filtro = '';
    const params = [];

    if (rol === 'Clienta' && idUsuario) {
        filtro = 'WHERE cl.id_usuario = ?';
        params.push(idUsuario);
    } else if (rol === 'Estilista' && idUsuario) {
        filtro = 'WHERE e.id_usuario = ?';
        params.push(idUsuario);
    }

    const [filas] = await db.query(`
        SELECT p.id_pago, p.id_cita, p.referencia, p.metodo, p.monto, p.estado,
               DATE_FORMAT(p.fecha_pago, '%Y-%m-%d %H:%i') AS fecha_pago,
               DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha_cita,
               TIME_FORMAT(c.hora, '%H:%i') AS hora_cita,
               s.nombre AS servicio,
               CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
               CONCAT(e.nombres, ' ', e.apellidos) AS estilista
        FROM pagos p
        JOIN citas c ON c.id_cita = p.id_cita
        JOIN servicios s ON s.id_servicio = c.id_servicio
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN estilistas e ON e.id_estilista = c.id_estilista
        ${filtro}
        ORDER BY p.fecha_pago DESC`, params);
    return filas;
}

async function crear({ idCita, referencia, metodo, monto, estado }) {
    const existente = await buscarPorCita(idCita);

    if (existente) {
        if (existente.estado === 'Pagado') {
            return { duplicado: true, pago: existente };
        }
        await db.query(
            `UPDATE pagos
             SET referencia = ?, metodo = ?, monto = ?, estado = ?, fecha_pago = CURRENT_TIMESTAMP
             WHERE id_cita = ?`,
            [referencia, metodo, monto, estado, idCita]
        );
        return { duplicado: false, pago: await buscarPorCita(idCita) };
    }

    await db.query(
        'INSERT INTO pagos (id_cita, referencia, metodo, monto, estado) VALUES (?, ?, ?, ?, ?)',
        [idCita, referencia, metodo, monto, estado]
    );
    return { duplicado: false, pago: await buscarPorCita(idCita) };
}

async function actualizarEstado(idPago, estado) {
    const [resultado] = await db.query(
        'UPDATE pagos SET estado = ?, fecha_pago = CURRENT_TIMESTAMP WHERE id_pago = ?',
        [estado, idPago]
    );
    return resultado.affectedRows > 0;
}

module.exports = { buscarPorCita, listar, crear, actualizarEstado };