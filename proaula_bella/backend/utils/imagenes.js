// Revisión de imágenes que llegan desde el navegador como texto base64
// ("data:image/webp;base64,..."). La usan las fotos de servicios, la foto
// de perfil y la vitrina. Devuelve { tipo, buffer } o { error }.
const MAX_BYTES = 1.5 * 1024 * 1024;   // 1,5 MB por imagen

// Revisa los primeros bytes del archivo para confirmar que de verdad es una imagen
function tipoDeImagen(buffer) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer.slice(0, 4).toString('hex') === '89504e47') return 'image/png';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
    return null;
}

function leerImagen(texto) {
    const coincide = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(texto || '');
    if (!coincide) return { error: 'Escoge una imagen JPG, PNG o WEBP.' };
    const buffer = Buffer.from(coincide[2], 'base64');
    const tipo = tipoDeImagen(buffer);
    if (!tipo) return { error: 'El archivo no es una imagen válida.' };
    if (buffer.length > MAX_BYTES) return { error: 'La imagen es muy pesada (máximo 1,5 MB).' };
    return { tipo, buffer };
}

// Envía una imagen guardada en la base de datos (el navegador la guarda en caché)
function enviarImagen(res, tipo, datos) {
    res.set('Content-Type', tipo);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(datos);
}

module.exports = { leerImagen, enviarImagen };
