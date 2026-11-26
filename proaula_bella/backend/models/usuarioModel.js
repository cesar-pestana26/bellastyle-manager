const db = require('../config/db');

async function buscarPorUsername(username) {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    return filas[0] || null;
}

async function crear(conexion, { nombre, username, passwordHash, rol, foto, telefono, email }) {
    const [resultado] = await conexion.query(
        'INSERT INTO usuarios (nombre, username, password, rol, foto, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, username, passwordHash, rol, foto, telefono || null, email || null]
    );
    return resultado.insertId;
}

async function actualizarPassword(username, passwordHash) {
    await db.query('UPDATE usuarios SET password = ? WHERE username = ?', [passwordHash, username]);
}

async function contactosRegistrados(idUsuario) {
    const [filas] = await db.query(`
        SELECT u.telefono, u.email FROM usuarios u WHERE u.id_usuario = ?
        UNION ALL
        SELECT c.telefono, c.email FROM clientas c WHERE c.id_usuario = ?`, [idUsuario, idUsuario]);
    const lista = [];
    for (const f of filas) {
        if (f.telefono) lista.push(String(f.telefono).trim());
        if (f.email) lista.push(String(f.email).trim().toLowerCase());
    }
    return lista;
}

async function buscarPorId(idUsuario) {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

async function actualizarCuenta(idUsuario, passwordHash, telefono) {
    if (telefono) {
        await db.query('UPDATE usuarios SET password = ?, telefono = ? WHERE id_usuario = ?', [passwordHash, telefono, idUsuario]);
    } else {
        await db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [passwordHash, idUsuario]);
    }
}

module.exports = { buscarPorUsername, buscarPorId, crear, actualizarPassword, actualizarCuenta, contactosRegistrados };
