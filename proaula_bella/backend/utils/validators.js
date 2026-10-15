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

// "Ana María López" -> { nombres: "Ana", apellidos: "María López" }
function separarNombre(nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    const nombres = partes.shift();
    const apellidos = partes.join(' ') || '-';
    return { nombres, apellidos };
}

module.exports = { nombreValido, usuarioValido, passwordValida, separarNombre };
