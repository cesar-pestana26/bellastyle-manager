const perfilModel = require('../models/perfilModel');
const productoModel = require('../models/productoModel');
const { nombreValido } = require('../utils/validators');
const { leerImagen, enviarImagen } = require('../utils/imagenes');
const { guardarImagen, borrarDeNube } = require('../utils/nube');

const ICONO_ROL = {
    Clienta: 'img/rol_clienta.svg',
    Estilista: 'img/rol_estilista.svg',
    Administradora: 'img/rol_admin.svg'
};

function errorServidor(res, err) {
    console.error('Error en perfil:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar la imagen.' });
}

async function verFoto(req, res) {
    try {
        const foto = await perfilModel.buscarFotoPerfil(req.params.id);
        if (foto) return enviarImagen(res, foto.tipo, foto.datos, foto.url);
        const usuario = await perfilModel.buscarUsuario(req.params.id);
        res.set('Cache-Control', 'no-cache');
        res.redirect(302, '/' + (ICONO_ROL[usuario && usuario.rol] || ICONO_ROL.Clienta));
    } catch (err) { errorServidor(res, err); }
}

async function cambiarFoto(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    try {
        const usuario = await perfilModel.buscarUsuario(req.params.id);
        if (!usuario) return res.status(404).json({ success: false, message: 'El usuario no existe.' });
        const anterior = await perfilModel.buscarFotoPerfil(usuario.id_usuario);
        const foto = await guardarImagen(imagen, 'perfiles');
        await perfilModel.guardarFotoPerfil(usuario.id_usuario, foto);
        await borrarDeNube(anterior && anterior.public_id);
        res.json({ success: true, message: 'Foto de perfil actualizada.' });
    } catch (err) { errorServidor(res, err); }
}

async function quitarFoto(req, res) {
    try {
        const anterior = await perfilModel.buscarFotoPerfil(req.params.id);
        await perfilModel.quitarFotoPerfil(req.params.id);
        await borrarDeNube(anterior && anterior.public_id);
        res.json({ success: true, message: 'Foto de perfil quitada.' });
    } catch (err) { errorServidor(res, err); }
}

async function listarVitrina(req, res) {
    try {
        const filas = await perfilModel.listarVitrina(Number(req.query.idUsuario) || null, req.query.todas ? 200 : 24);
        res.json({ success: true, data: filas.map((f) => ({ ...f, url: `/api/vitrina/${f.id_foto}/imagen` })) });
    } catch (err) { errorServidor(res, err); }
}

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
        const foto = await guardarImagen(imagen, 'vitrina');
        await perfilModel.agregarVitrina(usuario.id_usuario, foto, descripcion);
        res.status(201).json({ success: true, message: 'Foto agregada a la vitrina.' });
    } catch (err) { errorServidor(res, err); }
}

async function verImagenVitrina(req, res) {
    try {
        const foto = await perfilModel.buscarFotoVitrina(req.params.id);
        if (!foto) return res.status(404).end();
        enviarImagen(res, foto.tipo, foto.datos, foto.url);
    } catch (err) { errorServidor(res, err); }
}

async function eliminarVitrina(req, res) {
    try {
        const foto = await perfilModel.buscarFotoVitrina(req.params.id);
        if (!foto) return res.status(404).json({ success: false, message: 'La foto no existe.' });
        const quien = await perfilModel.buscarUsuario(req.query.idUsuario);
        if (!quien || (quien.id_usuario !== foto.id_usuario && quien.rol !== 'Administradora')) {
            return res.status(403).json({ success: false, message: 'Solo puedes quitar fotos de tu vitrina.' });
        }
        await perfilModel.eliminarVitrina(req.params.id);
        await borrarDeNube(foto.public_id);
        res.json({ success: true, message: 'Foto quitada de la vitrina.' });
    } catch (err) { errorServidor(res, err); }
}

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

async function verFotoProducto(req, res) {
    try {
        const foto = await productoModel.buscarFoto(req.params.id);
        if (foto) return enviarImagen(res, foto.tipo, foto.datos, foto.url);
        res.set('Cache-Control', 'no-cache');
        res.redirect(302, '/img/producto.svg');
    } catch (err) { errorServidor(res, err); }
}

async function cambiarFotoProducto(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    try {
        if (!await productoModel.existe(req.params.id)) return res.status(404).json({ success: false, message: 'El producto no existe.' });
        const anterior = await productoModel.buscarFoto(req.params.id);
        const foto = await guardarImagen(imagen, 'productos');
        await productoModel.guardarFoto(req.params.id, foto);
        await borrarDeNube(anterior && anterior.public_id);
        res.json({ success: true, message: 'Foto del producto actualizada.' });
    } catch (err) { errorServidor(res, err); }
}

async function quitarFotoProducto(req, res) {
    try {
        const anterior = await productoModel.buscarFoto(req.params.id);
        await productoModel.quitarFoto(req.params.id);
        await borrarDeNube(anterior && anterior.public_id);
        res.json({ success: true, message: 'Foto del producto quitada.' });
    } catch (err) { errorServidor(res, err); }
}

module.exports = {
    verFoto, cambiarFoto, quitarFoto, cambiarNombre,
    listarVitrina, agregarVitrina, verImagenVitrina, editarVitrina, eliminarVitrina,
    verFotoProducto, cambiarFotoProducto, quitarFotoProducto
};
