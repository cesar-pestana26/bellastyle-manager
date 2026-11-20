// Controlador del módulo de pagos (/api/pagos)
const db = require('../config/db');
const pagoModel = require('../models/pagoModel');

const METODOS_VALIDOS = ['Nequi', 'Tarjeta', 'PSE', 'Efectivo / Salón'];
const ESTADOS_VALIDOS = ['Pagado', 'Pendiente en Salón', 'Reembolsado'];

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

        const estadoPago = metodo === 'Efectivo / Salón' ? 'Pendiente en Salón' : 'Pagado';
        const referencia = 'TXN-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 89);

        const resultado = await pagoModel.crear({
            idCita,
            referencia,
            metodo,
            monto: Number(cita.precio),
            estado: estadoPago
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
            message: estadoPago === 'Pagado'
                ? 'Pago registrado correctamente en MySQL.'
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

module.exports = { listar, porCita, crear, cambiarEstado };