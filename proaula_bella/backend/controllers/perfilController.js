// Controlador de la personalización: foto de perfil (todos los roles)
// y vitrina de trabajos (estilistas y administradora).
const perfilModel = require('../models/perfilModel');
const productoModel = require('../models/productoModel');
const { nombreValido } = require('../utils/validators');
const { leerImagen, enviarImagen } = require('../utils/imagenes');

// Ícono que se muestra cuando la persona aún no ha subido foto
const ICONO_ROL = {
    Clienta: 'img/rol_clienta.svg',
    Estilista: 'img/rol_estilista.svg',
    Administradora: 'img/rol_admin.svg'
};

function errorServidor(res, err) {
    console.error('Error en perfil:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar la imagen.' });
}

// ---------------------------------------------------------------
// FOTO DE PERFIL
// ---------------------------------------------------------------

// GET /api/usuarios/:id/foto   La foto; si no tiene, redirige al ícono de su rol
async function verFoto(req, res) {
    try {
        const foto = await perfilModel.buscarFotoPerfil(req.params.id);
        if (foto) return enviarImagen(res, foto.tipo, foto.datos);
        const usuario = await perfilModel.buscarUsuario(req.params.id);
        res.set('Cache-Control', 'no-cache');
        res.redirect(302, '/' + (ICONO_ROL[usuario && usuario.rol] || ICONO_ROL.Clienta));
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/usuarios/:id/foto   Recibe: { imagen }
async function cambiarFoto(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    try {
        const usuario = await perfilModel.buscarUsuario(req.params.id);
        if (!usuario) return res.status(404).json({ success: false, message: 'El usuario no existe.' });
        await perfilModel.guardarFotoPerfil(usuario.id_usuario, imagen.tipo, imagen.buffer);
        res.json({ success: true, message: 'Foto de perfil actualizada.' });
    } catch (err) { errorServidor(res, err); }
}

// DELETE /api/usuarios/:id/foto
async function quitarFoto(req, res) {
    try {
        await perfilModel.quitarFotoPerfil(req.params.id);
        res.json({ success: true, message: 'Foto de perfil quitada.' });
    } catch (err) { errorServidor(res, err); }
}

// ---------------------------------------------------------------
// VITRINA
// ---------------------------------------------------------------

// GET /api/vitrina?idUsuario=5   (sin idUsuario: las más recientes de todo el salón)
async function listarVitrina(req, res) {
    try {
        const filas = await perfilModel.listarVitrina(Number(req.query.idUsuario) || null, req.query.todas ? 200 : 24);
        res.json({ success: true, data: filas.map((f) => ({ ...f, url: `/api/vitrina/${f.id_foto}/imagen` })) });
    } catch (err) { errorServidor(res, err); }
}

// POST /api/vitrina   Recibe: { idUsuario, imagen, descripcion }
async function agregarVitrina(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';
    if (descripcion.length > 120) return res.status(400).json({ success: false, message: 'La descripción puede tener máximo 120 caracteres.' });
    try {
        const usuario = await perfilModel.buscarUsuario(req.body.idUsuario);
        if (!usuario) return res.status(404).json({ success: false, message: 'El usuario no existe.' });
        if (usuario.rol === 'Clienta') return res.status(403).json({ success: false, message: 'Solo las estilistas y el salón tienen vitrina.' });
        if (await perfilModel.contarVitrina(usuario.id_usuario) >= perfilModel.MAX_VITRINA) {
            return res.status(400).json({ success: false, message: `La vitrina puede tener máximo ${perfilModel.MAX_VITRINA} fotos. Quita una antes.` });
        }
        await perfilModel.agregarVitrina(usuario.id_usuario, imagen.tipo, imagen.buffer, descripcion);
        res.status(201).json({ success: true, message: 'Foto agregada a la vitrina.' });
    } catch (err) { errorServidor(res, err); }
}

// GET /api/vitrina/:id/imagen
async function verImagenVitrina(req, res) {
    try {
        const foto = await perfilModel.buscarFotoVitrina(req.params.id);
        if (!foto) return res.status(404).end();
        enviarImagen(res, foto.tipo, foto.datos);
    } catch (err) { errorServidor(res, err); }
}

// DELETE /api/vitrina/:id?idUsuario=5   Solo la dueña de la foto o la administradora
async function eliminarVitrina(req, res) {
    try {
        const foto = await perfilModel.buscarFotoVitrina(req.params.id);
        if (!foto) return res.status(404).json({ success: false, message: 'La foto no existe.' });
        const quien = await perfilModel.buscarUsuario(req.query.idUsuario);
        if (!quien || (quien.id_usuario !== foto.id_usuario && quien.rol !== 'Administradora')) {
            return res.status(403).json({ success: false, message: 'Solo puedes quitar fotos de tu vitrina.' });
        }
        await perfilModel.eliminarVitrina(req.params.id);
        res.json({ success: true, message: 'Foto quitada de la vitrina.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/vitrina/:id   Recibe: { idUsuario, descripcion }   Cambia la descripción
async function editarVitrina(req, res) {
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';
    if (descripcion.length > 120) return res.status(400).json({ success: false, message: 'La descripción puede tener máximo 120 caracteres.' });
    try {
        const foto = await perfilModel.buscarFotoVitrina(req.params.id);
        if (!foto) return res.status(404).json({ success: false, message: 'La foto no existe.' });
        const quien = await perfilModel.buscarUsuario(req.body.idUsuario);
        if (!quien || (quien.id_usuario !== foto.id_usuario && quien.rol !== 'Administradora')) {
            return res.status(403).json({ success: false, message: 'Solo puedes editar fotos de tu vitrina.' });
        }
        await perfilModel.editarVitrina(req.params.id, descripcion);
        res.json({ success: true, message: 'Descripción actualizada.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/usuarios/:id/nombre   Recibe: { nombre }   El nombre que se muestra en el panel
async function cambiarNombre(req, res) {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    if (!nombreValido(nombre) || nombre.length > 60) {
        return res.status(400).json({ success: false, message: 'Escribe un nombre válido (solo letras, máximo 60).' });
    }
    try {
        const ok = await perfilModel.cambiarNombre(req.params.id, nombre);
        if (!ok) return res.status(404).json({ success: false, message: 'El usuario no existe.' });
        res.json({ success: true, message: 'Nombre actualizado.', nombre });
    } catch (err) { errorServidor(res, err); }
}

// ---------------------------------------------------------------
// FOTO DE PRODUCTO
// ---------------------------------------------------------------

// GET /api/productos/:id/foto   Si no tiene foto, muestra el ícono de producto
async function verFotoProducto(req, res) {
    try {
        const foto = await productoModel.buscarFoto(req.params.id);
        if (foto) return enviarImagen(res, foto.tipo, foto.datos);
        res.set('Cache-Control', 'no-cache');
        res.redirect(302, '/img/producto.svg');
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/productos/:id/foto   Recibe: { imagen }
async function cambiarFotoProducto(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    try {
        const ok = await productoModel.guardarFoto(req.params.id, imagen.tipo, imagen.buffer);
        if (!ok) return res.status(404).json({ success: false, message: 'El producto no existe.' });
        res.json({ success: true, message: 'Foto del producto actualizada.' });
    } catch (err) { errorServidor(res, err); }
}

// DELETE /api/productos/:id/foto
async function quitarFotoProducto(req, res) {
    try {
        await productoModel.quitarFoto(req.params.id);
        res.json({ success: true, message: 'Foto del producto quitada.' });
    } catch (err) { errorServidor(res, err); }
}

module.exports = {
    verFoto, cambiarFoto, quitarFoto, cambiarNombre,
    listarVitrina, agregarVitrina, verImagenVitrina, editarVitrina, eliminarVitrina,
    verFotoProducto, cambiarFotoProducto, quitarFotoProducto
};
