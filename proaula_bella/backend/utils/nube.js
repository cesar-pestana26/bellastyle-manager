const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

const CARPETA_BASE = 'bellastyle';

function nubeConfigurada() {
    const c = config.cloudinary;
    return Boolean(c.nombre && c.clave && c.secreto);
}

if (nubeConfigurada()) {
    cloudinary.config({
        cloud_name: config.cloudinary.nombre,
        api_key: config.cloudinary.clave,
        api_secret: config.cloudinary.secreto,
        secure: true
    });
}

async function subirANube(tipo, buffer, carpeta) {
    const archivo = `data:${tipo};base64,${buffer.toString('base64')}`;
    const r = await cloudinary.uploader.upload(archivo, {
        folder: `${CARPETA_BASE}/${carpeta}`,
        resource_type: 'image'
    });
    return { url: r.secure_url, publicId: r.public_id };
}

async function guardarImagen(imagen, carpeta) {
    if (!nubeConfigurada()) {
        console.warn('Cloudinary no está configurado: la imagen se guarda en la base de datos.');
        return { tipo: imagen.tipo, datos: imagen.buffer, url: null, publicId: null };
    }
    const { url, publicId } = await subirANube(imagen.tipo, imagen.buffer, carpeta);
    return { tipo: imagen.tipo, datos: null, url, publicId };
}

async function borrarDeNube(publicId) {
    if (!publicId || !nubeConfigurada()) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
        console.error('No se pudo borrar la imagen en Cloudinary:', err.message);
    }
}

module.exports = { nubeConfigurada, subirANube, guardarImagen, borrarDeNube };
