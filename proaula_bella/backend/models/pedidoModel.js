const db = require('../config/db');

async function listar(idClienta = null) {
    const [filas] = await db.query(`
        SELECT p.id_pedido, p.total, p.estado,
               DATE_FORMAT(p.creado_en, '%Y-%m-%d %H:%i') AS fecha,
               CONCAT(cl.nombres, ' ', cl.apellidos) AS clienta, cl.telefono,
               GROUP_CONCAT(CONCAT(i.cantidad, ' × ', pr.nombre) ORDER BY pr.nombre SEPARATOR ', ') AS detalle,
               SUM(i.cantidad) AS unidades
        FROM pedidos p
        JOIN clientas cl ON cl.id_clienta = p.id_clienta
        JOIN pedido_items i ON i.id_pedido = p.id_pedido
        JOIN productos pr ON pr.id_producto = i.id_producto
        ${idClienta ? 'WHERE p.id_clienta = ?' : ''}
        GROUP BY p.id_pedido
        ORDER BY p.creado_en DESC, p.id_pedido DESC`, idClienta ? [idClienta] : []);
    return filas;
}

async function buscarPorId(idPedido) {
    const [filas] = await db.query('SELECT * FROM pedidos WHERE id_pedido = ?', [idPedido]);
    return filas[0] || null;
}

module.exports = { listar, buscarPorId };
