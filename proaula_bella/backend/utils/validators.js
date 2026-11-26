const RE_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{2,100}$/;
const RE_USUARIO = /^[a-zA-Z0-9_.]{3,50}$/;

function nombreValido(valor) {
    return typeof valor === 'string' && RE_NOMBRE.test(valor.trim());
}

function usuarioValido(valor) {
    return typeof valor === 'string' && RE_USUARIO.test(valor.trim());
}

function passwordValida(valor) {
    return typeof valor === 'string' && valor.length >= 6;
}

function telefonoValido(valor) {
    if (typeof valor !== 'string') return false;
    const limpio = valor.replace(/[\s-]/g, '').replace(/^\+57/, '');
    return /^(3\d{9}|60\d{8})$/.test(limpio);
}

function emailValido(valor) {
    return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function separarNombre(nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    const nombres = partes.shift();
    const apellidos = partes.join(' ') || '-';
    return { nombres, apellidos };
}

module.exports = { nombreValido, usuarioValido, passwordValida, telefonoValido, emailValido, separarNombre };
