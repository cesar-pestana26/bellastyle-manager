// Modelo de la tabla productos
const db = require('../config/db');

async function listarActivos() {
    const [filas] = await db.query("SELECT p.*, EXISTS(SELECT 1 FROM fotos_producto f WHERE f.id_producto = p.id_producto) AS tiene_foto FROM productos p WHERE estado = 'Activo' ORDER BY nombre");
    return filas;
}

// Todos, incluso los inactivos (para la administradora)
async function listarTodos() {
    const [filas] = await db.query('SELECT p.*, EXISTS(SELECT 1 FROM fotos_producto f WHERE f.id_producto = p.id_producto) AS tiene_foto FROM productos p ORDER BY nombre');
    return filas;
}

async function crear({ nombre, precio, stock }) {
    const [resultado] = await db.query(
        'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
        [nombre, precio, stock]
    );
    return resultado.insertId;
}

async function actualizar(idProducto, { nombre, precio, stock }) {
    const [resultado] = await db.query(
        'UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id_producto = ?',
        [nombre, precio, stock, idProducto]
    );
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idProducto, estado) {
    const [resultado] = await db.query('UPDATE productos SET estado = ? WHERE id_producto = ?', [estado, idProducto]);
    return resultado.affectedRows > 0;
}

// --- Foto del producto (una por producto) ---

async function guardarFoto(idProducto, tipo, datos) {
    const [resultado] = await db.query(
        'REPLACE INTO fotos_producto (id_producto, tipo, datos) SELECT id_producto, ?, ? FROM productos WHERE id_producto = ?',
        [tipo, datos, idProducto]
    );
    return resultado.affectedRows > 0;
}

async function buscarFoto(idProducto) {
    const [filas] = await db.query('SELECT tipo, datos FROM fotos_producto WHERE id_producto = ?', [idProducto]);
    return filas[0] || null;
}

async function quitarFoto(idProducto) {
    await db.query('DELETE FROM fotos_producto WHERE id_producto = ?', [idProducto]);
}

module.exports = { listarActivos, listarTodos, crear, actualizar, cambiarEstado, guardarFoto, buscarFoto, quitarFoto };
