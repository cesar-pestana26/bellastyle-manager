// Modelo de la tabla pagos (transacciones asociadas a una cita)
const db = require('../config/db');

async function buscarPorCita(idCita) {
    const [filas] = await db.query(`
        SELECT p.id_pago, p.id_cita, p.referencia, p.metodo, p.monto, p.estado, p.comprobante,
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
        SELECT p.id_pago, p.id_cita, p.referencia, p.metodo, p.monto, p.estado, p.comprobante,
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

async function crear({ idCita, referencia, metodo, monto, estado, comprobante = null }) {
    const existente = await buscarPorCita(idCita);

    if (existente) {
        if (existente.estado === 'Pagado') {
            return { duplicado: true, pago: existente };
        }
        await db.query(
            `UPDATE pagos
             SET referencia = ?, metodo = ?, monto = ?, estado = ?, comprobante = ?, fecha_pago = CURRENT_TIMESTAMP
             WHERE id_cita = ?`,
            [referencia, metodo, monto, estado, comprobante, idCita]
        );
        return { duplicado: false, pago: await buscarPorCita(idCita) };
    }

    await db.query(
        'INSERT INTO pagos (id_cita, referencia, metodo, monto, estado, comprobante) VALUES (?, ?, ?, ?, ?, ?)',
        [idCita, referencia, metodo, monto, estado, comprobante]
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

// ---------- Datos de cobro del salón (tabla pago_salon, una sola fila) ----------
async function datosSalon() {
    const [filas] = await db.query(
        "SELECT llave, titular, qr_tipo IS NOT NULL AS tiene_qr, UNIX_TIMESTAMP(actualizado) AS version FROM pago_salon WHERE id = 1");
    return filas[0] || null;
}

async function qrSalon() {
    const [filas] = await db.query('SELECT qr_tipo, qr_datos FROM pago_salon WHERE id = 1 AND qr_datos IS NOT NULL');
    return filas[0] || null;
}

// Guarda la llave y el titular; la imagen solo si llega una nueva
async function guardarDatosSalon({ llave, titular, qrTipo, qrDatos }) {
    await db.query(`INSERT INTO pago_salon (id, llave, titular, qr_tipo, qr_datos) VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE llave = VALUES(llave), titular = VALUES(titular),
            qr_tipo = COALESCE(VALUES(qr_tipo), qr_tipo), qr_datos = COALESCE(VALUES(qr_datos), qr_datos)`,
        [llave, titular, qrTipo || null, qrDatos || null]);
}

module.exports = { datosSalon, qrSalon, guardarDatosSalon, buscarPorCita, listar, crear, actualizarEstado };