// Controlador de fotos de los servicios.
// La administradora sube fotos desde su panel (pestaña Servicios -> botón Fotos)
// y se muestran en el menú de servicios de la página de inicio.
// El navegador envía la imagen ya reducida (máximo 1200 px) como texto base64.
const fotoModel = require('../models/fotoServicioModel');
const servicioModel = require('../models/servicioModel');
const { leerImagen, enviarImagen } = require('../utils/imagenes');

function errorServidor(res, err) {
    console.error('Error en fotos:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar la foto.' });
}

// GET /api/fotos-servicios   y   GET /api/servicios/:id/fotos
async function listar(req, res) {
    try {
        const filas = await fotoModel.listar(req.params.id);
        res.json({ success: true, data: filas.map((f) => ({ ...f, url: `/api/fotos/${f.id_foto}` })) });
    } catch (err) { errorServidor(res, err); }
}

// POST /api/servicios/:id/fotos   Recibe: { imagen: "data:image/webp;base64,..." }
async function subir(req, res) {
    const imagen = leerImagen(req.body.imagen);
    if (imagen.error) return res.status(400).json({ success: false, message: imagen.error });
    try {
        const servicio = await servicioModel.buscarPorId(req.params.id);
        if (!servicio) return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        if (await fotoModel.contar(servicio.id_servicio) >= fotoModel.MAX_POR_SERVICIO) {
            return res.status(400).json({ success: false, message: `Cada servicio puede tener máximo ${fotoModel.MAX_POR_SERVICIO} fotos. Quita una antes.` });
        }
        await fotoModel.crear(servicio.id_servicio, imagen.tipo, imagen.buffer);
        res.status(201).json({ success: true, message: 'Foto subida.' });
    } catch (err) { errorServidor(res, err); }
}

// GET /api/fotos/:id   Devuelve la imagen (el navegador la guarda en caché un día)
async function ver(req, res) {
    try {
        const foto = await fotoModel.buscar(req.params.id);
        if (!foto) return res.status(404).end();
        enviarImagen(res, foto.tipo, foto.datos);
    } catch (err) { errorServidor(res, err); }
}

// DELETE /api/fotos/:id
async function eliminar(req, res) {
    try {
        const borrada = await fotoModel.eliminar(req.params.id);
        if (!borrada) return res.status(404).json({ success: false, message: 'La foto no existe.' });
        res.json({ success: true, message: 'Foto eliminada.' });
    } catch (err) { errorServidor(res, err); }
}

module.exports = { listar, subir, ver, eliminar };
