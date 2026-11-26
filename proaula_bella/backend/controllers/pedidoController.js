const db = require('../config/db');
const pedidoModel = require('../models/pedidoModel');
const clienteModel = require('../models/clienteModel');

const ESTADOS = ['Pendiente', 'Listo para recoger', 'Entregado', 'Cancelado'];

async function listar(req, res) {
    try {
        if (req.usuario.rol === 'Administradora') return res.json({ success: true, data: await pedidoModel.listar() });
        const clienta = await clienteModel.buscarPorUsuario(req.usuario.id);
        res.json({ success: true, data: clienta ? await pedidoModel.listar(clienta.id_clienta) : [] });
    } catch (err) {
        console.error('Error al listar pedidos:', err.message);
        res.status(500).json({ success: false, message: 'No se pudieron consultar los pedidos.' });
    }
}

async function crear(req, res) {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const limpios = items
        .map((i) => ({ id: Number(i.id), cantidad: Math.floor(Number(i.cantidad)) }))
        .filter((i) => i.id > 0 && i.cantidad > 0 && i.cantidad <= 20);
    if (limpios.length === 0 || limpios.length !== items.length) {
        return res.status(400).json({ success: false, message: 'El carrito está vacío o tiene cantidades no válidas.' });
    }

    const conexion = await db.getConnection();
    try {
        const clienta = await clienteModel.buscarPorUsuario(req.usuario.id);
        if (!clienta) return res.status(404).json({ success: false, message: 'Tu cuenta no tiene perfil de clienta.' });

        await conexion.beginTransaction();
        const ids = limpios.map((i) => i.id);
        const [productos] = await conexion.query(
            "SELECT id_producto, nombre, precio, stock, estado FROM productos WHERE id_producto IN (?) ORDER BY id_producto FOR UPDATE", [ids]);

        let total = 0;
        for (const item of limpios) {
            const p = productos.find((x) => x.id_producto === item.id);
            if (!p || p.estado !== 'Activo') {
                await conexion.rollback();
                return res.status(400).json({ success: false, message: 'Un producto del carrito ya no está disponible.' });
            }
            if (p.stock < item.cantidad) {
                await conexion.rollback();
                return res.status(409).json({ success: false, message: `Solo quedan ${p.stock} unidades de ${p.nombre}.` });
            }
            item.precio = Number(p.precio);
            total += item.precio * item.cantidad;
        }

        const [r] = await conexion.query('INSERT INTO pedidos (id_clienta, total) VALUES (?, ?)', [clienta.id_clienta, total]);
        for (const item of limpios) {
            await conexion.query('INSERT INTO pedido_items (id_pedido, id_producto, cantidad, precio) VALUES (?, ?, ?, ?)',
                [r.insertId, item.id, item.cantidad, item.precio]);
            await conexion.query('UPDATE productos SET stock = stock - ? WHERE id_producto = ?', [item.cantidad, item.id]);
        }
        await conexion.commit();
        res.status(201).json({ success: true, message: `Pedido #${r.insertId} recibido. Te avisaremos cuando esté listo para recoger en el salón.`, data: { id: r.insertId, total } });
    } catch (err) {
        await conexion.rollback().catch(() => {});
        console.error('Error al crear pedido:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo guardar el pedido.' });
    } finally {
        conexion.release();
    }
}

async function cambiarEstado(req, res) {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) return res.status(400).json({ success: false, message: 'Estado no válido.' });
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        const [filas] = await conexion.query('SELECT estado FROM pedidos WHERE id_pedido = ? FOR UPDATE', [req.params.id]);
        if (!filas.length) { await conexion.rollback(); return res.status(404).json({ success: false, message: 'El pedido no existe.' }); }
        if (filas[0].estado === 'Cancelado') { await conexion.rollback(); return res.status(400).json({ success: false, message: 'Un pedido cancelado no se puede cambiar.' }); }
        if (estado === 'Cancelado') {
            await conexion.query(`UPDATE productos p JOIN pedido_items i ON i.id_producto = p.id_producto
                SET p.stock = p.stock + i.cantidad WHERE i.id_pedido = ?`, [req.params.id]);
        }
        await conexion.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estado, req.params.id]);
        await conexion.commit();
        res.json({ success: true, message: `Pedido marcado como ${estado.toLowerCase()}.` });
    } catch (err) {
        await conexion.rollback().catch(() => {});
        console.error('Error al cambiar estado del pedido:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo actualizar el pedido.' });
    } finally {
        conexion.release();
    }
}

module.exports = { listar, crear, cambiarEstado };
