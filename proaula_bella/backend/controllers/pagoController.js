// Controlador del módulo de pagos (/api/pagos)
const db = require('../config/db');
const pagoModel = require('../models/pagoModel');

const { leerImagen, enviarImagen } = require('../utils/imagenes');

// Bre-B: la clienta escanea el QR del salón, paga desde su banco y escribe el número
// del comprobante. El pago queda "Por verificar" hasta que la administradora lo confirma.
const METODOS_VALIDOS = ['Bre-B', 'Efectivo / Salón', 'Nequi', 'Tarjeta', 'PSE'];
const ESTADOS_VALIDOS = ['Pagado', 'Por verificar', 'Pendiente en Salón', 'Rechazado', 'Reembolsado'];

async function listar(req, res) {
    try {
        const { rol, idUsuario } = req.query;
        const datos = await pagoModel.listar({ rol, idUsuario });
        res.json({ success: true, data: datos });
    } catch (error) {
        console.error('Error al listar pagos:', error);
        res.status(500).json({ success: false, message: 'Error al consultar los pagos en MySQL.' });
    }
}

async function porCita(req, res) {
    try {
        const pago = await pagoModel.buscarPorCita(req.params.idCita);
        if (!pago) {
            return res.status(404).json({ success: false, message: 'Esta cita aún no tiene pago registrado.' });
        }
        res.json({ success: true, data: pago });
    } catch (error) {
        console.error('Error al buscar pago por cita:', error);
        res.status(500).json({ success: false, message: 'Error al consultar el pago de la cita.' });
    }
}

async function crear(req, res) {
    try {
        const idCita = Number(req.body.idCita || req.body.id_cita);
        const metodo = String(req.body.metodo || '').trim();

        if (!idCita || !METODOS_VALIDOS.includes(metodo)) {
            return res.status(400).json({
                success: false,
                message: 'Datos de pago incompletos o método no válido.'
            });
        }

        const [citas] = await db.query(
            'SELECT id_cita, precio, estado FROM citas WHERE id_cita = ?',
            [idCita]
        );
        const cita = citas[0];

        if (!cita) {
            return res.status(404).json({ success: false, message: 'La cita indicada no existe.' });
        }
        if (cita.estado === 'Cancelada') {
            return res.status(400).json({ success: false, message: 'No se puede pagar una cita cancelada.' });
        }

        let comprobante = null;
        if (metodo === 'Bre-B') {
            comprobante = String(req.body.comprobante || '').trim().toUpperCase();
            if (!/^[A-Z0-9-]{4,40}$/.test(comprobante)) {
                return res.status(400).json({ success: false, message: 'Escribe el número del comprobante de la transferencia (de 4 a 40 letras o números).' });
            }
            const salon = await pagoModel.datosSalon();
            if (!salon || (!salon.llave && !salon.tiene_qr)) {
                return res.status(400).json({ success: false, message: 'El salón aún no ha configurado su llave Bre-B. Elige pagar en el salón.' });
            }
        }
        const estadoPago = metodo === 'Efectivo / Salón' ? 'Pendiente en Salón'
            : metodo === 'Bre-B' ? 'Por verificar' : 'Pagado';
        const referencia = 'TXN-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 89);

        const resultado = await pagoModel.crear({
            idCita,
            referencia,
            metodo,
            monto: Number(cita.precio),
            estado: estadoPago,
            comprobante
        });

        if (resultado.duplicado) {
            return res.status(400).json({
                success: false,
                message: 'Esta cita ya se encuentra pagada.',
                data: resultado.pago
            });
        }

        res.status(201).json({
            success: true,
            message: estadoPago === 'Pagado' ? 'Pago registrado correctamente.'
                : estadoPago === 'Por verificar' ? 'Recibimos tu comprobante. El salón confirmará el pago en cuanto vea la transferencia.'
                : 'Pago presencial en salón registrado.',
            data: resultado.pago
        });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, message: 'Error del servidor al registrar el pago.' });
    }
}

async function cambiarEstado(req, res) {
    try {
        const idPago = Number(req.params.id);
        const estado = String(req.body.estado || '').trim();

        if (!idPago || !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado de pago no válido.' });
        }

        const actualizado = await pagoModel.actualizarEstado(idPago, estado);
        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Pago no encontrado.' });
        }

        res.json({ success: true, message: `Pago actualizado a "${estado}".` });
    } catch (error) {
        console.error('Error al actualizar estado del pago:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el estado del pago.' });
    }
}

// GET /api/pago-salon  -> llave, titular y si hay QR (público: lo ve la clienta al pagar)
async function datosSalon(req, res) {
    try {
        const d = await pagoModel.datosSalon();
        res.json({ success: true, data: d ? {
            llave: d.llave, titular: d.titular, tieneQr: Boolean(d.tiene_qr),
            qr: d.tiene_qr ? `/api/pago-salon/qr?v=${d.version}` : null
        } : null });
    } catch (error) {
        console.error('Error al leer datos de cobro:', error);
        res.status(500).json({ success: false, message: 'No se pudieron leer los datos de cobro.' });
    }
}

// GET /api/pago-salon/qr  -> la imagen del QR
async function qrSalon(req, res) {
    try {
        const qr = await pagoModel.qrSalon();
        if (!qr) return res.status(404).json({ success: false, message: 'El salón no ha subido su QR.' });
        enviarImagen(res, qr.qr_tipo, qr.qr_datos);
    } catch (error) {
        console.error('Error al enviar el QR:', error);
        res.status(500).json({ success: false, message: 'No se pudo cargar el QR.' });
    }
}

// PUT /api/pago-salon   Recibe: { llave?, titular?, imagen? }  (solo administradora)
// La llave y el titular son opcionales: basta con el QR (o con la llave si no hay QR).
async function guardarSalon(req, res) {
    const llave = String(req.body.llave || '').trim() || null;
    const titular = String(req.body.titular || '').trim() || null;
    if (llave && llave.length > 80) return res.status(400).json({ success: false, message: 'La llave Bre-B es muy larga (máximo 80 caracteres).' });
    if (titular && titular.length > 100) return res.status(400).json({ success: false, message: 'El nombre del titular es muy largo (máximo 100 caracteres).' });
    let imagen = {};
    if (req.body.imagen) {
        imagen = leerImagen(req.body.imagen);
        if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    }
    try {
        const actual = await pagoModel.datosSalon();
        if (!imagen.tipo && !(actual && actual.tiene_qr) && !llave) {
            return res.status(400).json({ success: false, message: 'Sube la imagen del QR (o escribe la llave Bre-B).' });
        }
        await pagoModel.guardarDatosSalon({ llave, titular, qrTipo: imagen.tipo, qrDatos: imagen.buffer });
        res.json({ success: true, message: 'Datos de cobro Bre-B guardados.' });
    } catch (error) {
        console.error('Error al guardar datos de cobro:', error);
        res.status(500).json({ success: false, message: 'No se pudieron guardar los datos de cobro.' });
    }
}

module.exports = { listar, porCita, crear, cambiarEstado, datosSalon, qrSalon, guardarSalon };