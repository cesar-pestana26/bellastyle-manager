const db = require('../config/db');

const MAX_VITRINA = 12;

async function buscarUsuario(idUsuario) {
    const [filas] = await db.query('SELECT id_usuario, nombre, rol FROM usuarios WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

async function guardarFotoPerfil(idUsuario, tipo, datos) {
    await db.query('REPLACE INTO fotos_perfil (id_usuario, tipo, datos) VALUES (?, ?, ?)', [idUsuario, tipo, datos]);
}

async function buscarFotoPerfil(idUsuario) {
    const [filas] = await db.query('SELECT tipo, datos FROM fotos_perfil WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

async function quitarFotoPerfil(idUsuario) {
    await db.query('DELETE FROM fotos_perfil WHERE id_usuario = ?', [idUsuario]);
}

async function listarVitrina(idUsuario, limite = 24) {
    const sql = `
        SELECT v.id_foto, v.id_usuario, v.descripcion, u.nombre AS autor, u.rol
        FROM vitrina v JOIN usuarios u ON u.id_usuario = v.id_usuario
        ${idUsuario ? 'WHERE v.id_usuario = ?' : ''}
        ORDER BY v.id_foto DESC LIMIT ?`;
    const [filas] = await db.query(sql, idUsuario ? [idUsuario, limite] : [limite]);
    return filas;
}

async function contarVitrina(idUsuario) {
    const [filas] = await db.query('SELECT COUNT(*) AS total FROM vitrina WHERE id_usuario = ?', [idUsuario]);
    return filas[0].total;
}

async function agregarVitrina(idUsuario, tipo, datos, descripcion) {
    const [resultado] = await db.query(
        'INSERT INTO vitrina (id_usuario, tipo, datos, descripcion) VALUES (?, ?, ?, ?)',
        [idUsuario, tipo, datos, descripcion || null]
    );
    return resultado.insertId;
}

async function buscarFotoVitrina(idFoto) {
    const [filas] = await db.query('SELECT id_usuario, tipo, datos FROM vitrina WHERE id_foto = ?', [idFoto]);
    return filas[0] || null;
}

async function eliminarVitrina(idFoto) {
    const [resultado] = await db.query('DELETE FROM vitrina WHERE id_foto = ?', [idFoto]);
    return resultado.affectedRows > 0;
}

async function editarVitrina(idFoto, descripcion) {
    await db.query('UPDATE vitrina SET descripcion = ? WHERE id_foto = ?', [descripcion || null, idFoto]);
}

async function cambiarNombre(idUsuario, nombre) {
    const [resultado] = await db.query('UPDATE usuarios SET nombre = ? WHERE id_usuario = ?', [nombre, idUsuario]);
    return resultado.affectedRows > 0;
}

module.exports = {
    editarVitrina, cambiarNombre,
    MAX_VITRINA, buscarUsuario,
    guardarFotoPerfil, buscarFotoPerfil, quitarFotoPerfil,
    listarVitrina, contarVitrina, agregarVitrina, buscarFotoVitrina, eliminarVitrina
};
