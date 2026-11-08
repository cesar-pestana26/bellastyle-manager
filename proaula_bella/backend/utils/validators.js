// Validaciones que se usan en varios controladores
const RE_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,100}$/;
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

// Teléfono: solo números, espacios y "+", de 7 a 20 caracteres. Ej: "300 111 2233"
// Teléfono de Colombia: 10 dígitos. Celular empieza por 3 (300 123 4567)
// y fijo por 60 (601 234 5678). Se aceptan espacios y el prefijo +57.
function telefonoValido(valor) {
    if (typeof valor !== 'string') return false;
    const limpio = valor.replace(/[\s-]/g, '').replace(/^\+57/, '');
    return /^(3\d{9}|60\d{8})$/.test(limpio);
}

// Correo con forma texto@dominio.ext
function emailValido(valor) {
    return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

// "Ana María López" -> { nombres: "Ana", apellidos: "María López" }
function separarNombre(nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    const nombres = partes.shift();
    const apellidos = partes.join(' ') || '-';
    return { nombres, apellidos };
}

module.exports = { nombreValido, usuarioValido, passwordValida, telefonoValido, emailValido, separarNombre };
