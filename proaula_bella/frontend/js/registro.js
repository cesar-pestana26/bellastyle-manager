// js/registro.js - Registro de usuarios con unicidad estricta de cuenta y rol

const CODIGO_ADMIN_VALIDO = 'BELLA2026';

const ROLES_REGISTRO = typeof ROLES !== 'undefined' ? ROLES : {
  cliente: { titulo: 'Clienta', imagen: 'img/rol_clienta.svg' },
  estilista: { titulo: 'Estilista', imagen: 'img/logo.webp' },
  admin: { titulo: 'Administradora', imagen: 'img/logo.webp' }
};

const CUENTAS_BASE_SISTEMA = [
  { id: 1, nombre: 'Administradora Principal', usuario: 'admin', username: 'admin', email: 'admin@bellastyle.com', password: '123', rol: 'admin', telefono: '3000000001' },
  { id: 2, nombre: 'Diana Carmen', usuario: 'diana', username: 'diana', email: 'diana@bellastyle.com', password: '123', rol: 'estilista', especialidad: 'Especialista en Balayage & Color', telefono: '3000000002' },
  { id: 3, nombre: 'Sofía Martínez', usuario: 'sofia', username: 'sofia', email: 'sofia@bellastyle.com', password: '123', rol: 'estilista', especialidad: 'Manicura Rusa & Nail Art', telefono: '3000000003' },
  { id: 4, nombre: 'Mariana Sofía', usuario: 'cliente', username: 'cliente', email: 'cliente@bellastyle.com', password: '123', rol: 'cliente', telefono: '3001234567' }
];

let rolActual = new URLSearchParams(window.location.search).get('rol');
if (!ROLES_REGISTRO[rolActual]) rolActual = 'cliente';

function normalizarClaveRol(rol) {
  const r = String(rol || '').toLowerCase().trim();
  if (r === 'admin' || r.includes('admin')) return 'admin';
  if (r === 'estilista' || r.includes('estilista')) return 'estilista';
  return 'cliente';
}

function obtenerNombreLegibleRol(rol) {
  const clave = normalizarClaveRol(rol);
  return ROLES_REGISTRO[clave]?.titulo || 'Clienta';
}

function obtenerUsuariosRegistrados() {
  let listaUsuarios = [];
  try {
    listaUsuarios = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];
  } catch (e) {
    listaUsuarios = [];
  }

  let huboCambios = false;
  CUENTAS_BASE_SISTEMA.forEach(base => {
    const yaExiste = listaUsuarios.some(
      u => String(u.usuario || u.username || '').toLowerCase().trim() === base.usuario
    );
    if (!yaExiste) {
      listaUsuarios.push(base);
      huboCambios = true;
    }
  });

  if (huboCambios) {
    localStorage.setItem('usuariosRegistrados', JSON.stringify(listaUsuarios));
  }

  return listaUsuarios;
}

function dibujarSelector() {
  const selector = document.getElementById('selectorRol');
  if (!selector) return;

  selector.innerHTML = '';
  for (const clave in ROLES_REGISTRO) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = ROLES_REGISTRO[clave].titulo;
    const esActivo = clave === rolActual;

    boton.className = `pestana py-2 px-3 rounded-lg font-semibold text-xs transition text-center ${
      esActivo ? 'pestana-activa bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

    boton.addEventListener('click', () => cambiarRol(clave));
    selector.appendChild(boton);
  }
}

function cambiarRol(clave) {
  rolActual = clave;

  const tituloEl = document.getElementById('tituloRol');
  const imagenEl = document.getElementById('imagenRol');
  if (tituloEl) tituloEl.textContent = ROLES_REGISTRO[clave].titulo;
  if (imagenEl) imagenEl.src = ROLES_REGISTRO[clave].imagen;

  document.querySelectorAll('[data-solo]').forEach((bloque) => {
    const debeMostrar = bloque.dataset.solo === clave;
    bloque.classList.toggle('hidden', !debeMostrar);
    bloque.style.display = debeMostrar ? 'block' : 'none';
  });

  const alerta = document.getElementById('alerta');
  if (alerta) alerta.style.display = 'none';

  dibujarSelector();
  history.replaceState(null, '', '?rol=' + clave);
}

async function cargarServicios() {
  const contenedor = document.getElementById('listaServicios');
  if (!contenedor) return;

  const SERVICIOS_DEFAULT = [
    { id_servicio: 1, nombre: 'Corte de Cabello' },
    { id_servicio: 2, nombre: 'Tinte / Coloración' },
    { id_servicio: 3, nombre: 'Mechas / Balayage' },
    { id_servicio: 4, nombre: 'Peinado para Evento' },
    { id_servicio: 5, nombre: 'Manicure' },
    { id_servicio: 6, nombre: 'Pedicure' },
    { id_servicio: 7, nombre: 'Tratamiento Capilar' }
  ];

  let servicios = SERVICIOS_DEFAULT;

  try {
    if (typeof pedir === 'function') {
      const respuesta = await pedir('/servicios');
      if (respuesta && respuesta.success && Array.isArray(respuesta.data) && respuesta.data.length > 0) {
        servicios = respuesta.data;
      }
    }
  } catch (e) {}

  const funcEscapar = typeof escapar === 'function' ? escapar : (str) => String(str || '');

  contenedor.innerHTML = servicios.map((s) => `
    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs transition hover:border-pink-400/50 hover:bg-white/10">
      <input type="checkbox" name="servicio" value="${s.id_servicio}" data-nombre="${funcEscapar(s.nombre)}" class="accent-pink-500 rounded">
      <span class="text-white">${funcEscapar(s.nombre)}</span>
    </label>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  obtenerUsuariosRegistrados();

  const form = document.getElementById('formRegistro');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnRegistrar');

    const nombre = document.getElementById('nombre').value.trim();
    const userVal = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;
    const emailVal = document.getElementById('email')?.value.trim() || '';

    if (!nombre || !userVal || !password) {
      mostrarMensajeAlerta(alerta, 'Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    if (/\s/.test(userVal) || userVal.length < 3) {
      mostrarMensajeAlerta(alerta, 'El usuario debe tener al menos 3 caracteres y no contener espacios.', 'error');
      return;
    }

    // REGLA DE UNICIDAD: Bloquear si el usuario o el correo ya existen en CUALQUIER rol
    const listaUsuarios = obtenerUsuariosRegistrados();
    const userNorm = userVal.toLowerCase();
    const emailNorm = emailVal.toLowerCase();

    const cuentaExistente = listaUsuarios.find(u => {
      const uUser = String(u.usuario || u.username || '').toLowerCase().trim();
      const uEmail = String(u.email || '').toLowerCase().trim();
      const coincideUsuario = uUser === userNorm;
      const coincideCorreo = emailNorm !== '' && uEmail !== '' && uEmail === emailNorm;
      return coincideUsuario || coincideCorreo;
    });

    if (cuentaExistente) {
      const rolYaRegistrado = obtenerNombreLegibleRol(cuentaExistente.rol);
      const rolIntentado = obtenerNombreLegibleRol(rolActual);
      const datoDuplicado = String(cuentaExistente.usuario || cuentaExistente.username || '').toLowerCase().trim() === userNorm
        ? `el usuario "${userVal}"`
        : `el correo "${emailVal}"`;

      mostrarMensajeAlerta(
        alerta,
        `No es posible completar el registro: ${datoDuplicado} ya pertenece a una cuenta con rol de ${rolYaRegistrado}. No se permite registrarlo nuevamente como ${rolIntentado} ni en otro rol.`,
        'error'
      );
      return;
    }

    const rolNormalizado = normalizarClaveRol(rolActual);

    const datos = {
      id: Date.now(),
      rol: rolNormalizado,
      nombre: nombre,
      usuario: userVal,
      username: userVal,
      email: emailVal,
      password: password
    };

    if (rolNormalizado === 'cliente') {
      datos.telefono = document.getElementById('telefono')?.value.trim() || '';
      datos.profesion = document.getElementById('profesion')?.value.trim() || '';
    } else if (rolNormalizado === 'estilista') {
      const checks = [...document.querySelectorAll('input[name="servicio"]:checked')];
      if (checks.length === 0) {
        mostrarMensajeAlerta(alerta, 'Selecciona al menos un servicio de especialidad.', 'error');
        return;
      }
      datos.servicios = checks.map((c) => Number(c.value));
      const nombresEsp = checks.map((c) => c.dataset.nombre).filter(Boolean);
      datos.especialidad = nombresEsp.slice(0, 2).join(' & ') || 'Estilista Profesional';
    } else if (rolNormalizado === 'admin') {
      const cod = (document.getElementById('codigo')?.value || '').trim();
      if (!cod) {
        mostrarMensajeAlerta(alerta, 'Ingresa el código de autorización de Administradora.', 'error');
        return;
      }
      datos.codigoAdmin = cod;
      datos.codigo = cod;
    }

    if (boton) boton.disabled = true;

    let respuesta = null;
    try {
      if (typeof pedir === 'function') {
        respuesta = await pedir('/register', 'POST', datos);
        if (!respuesta || (!respuesta.success && !respuesta.errorRed)) {
          respuesta = await pedir('/registro', 'POST', datos);
        }
      }
    } catch (err) {}

    if ((!respuesta || respuesta.errorRed) && rolNormalizado === 'admin' && datos.codigo !== CODIGO_ADMIN_VALIDO) {
      mostrarMensajeAlerta(alerta, 'Código de autorización de Administradora incorrecto.', 'error');
      if (boton) boton.disabled = false;
      return;
    }

    const destinoRedireccion = rolNormalizado === 'admin'
      ? 'admin.html'
      : `panel.html?rol=${rolNormalizado}`;

    if ((respuesta && respuesta.success) || !respuesta || respuesta.errorRed) {
      const registradoOk = guardarEnUsuariosRegistrados(datos);
      if (!registradoOk) {
        mostrarMensajeAlerta(alerta, 'Este usuario ya se encuentra registrado en otro rol.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      const usuarioSesion = (respuesta && respuesta.usuario)
        ? { ...respuesta.usuario, rol: rolNormalizado }
        : crearSesionSinClave(datos);

      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioSesion));
      mostrarMensajeAlerta(alerta, `Cuenta registrada como ${obtenerNombreLegibleRol(rolNormalizado)}. Redirigiendo a tu panel...`, 'ok');
      setTimeout(() => { window.location.replace(destinoRedireccion); }, 1100);
    } else {
      mostrarMensajeAlerta(alerta, respuesta.mensaje || respuesta.message || 'Error al procesar el registro.', 'error');
      if (boton) boton.disabled = false;
    }
  });

  cambiarRol(rolActual);
  cargarServicios();
});

function crearSesionSinClave(datos) {
  const copia = { ...datos };
  delete copia.password;
  delete copia.codigoAdmin;
  delete copia.codigo;
  return copia;
}

function guardarEnUsuariosRegistrados(nuevoUsuario) {
  try {
    const listaUsuarios = obtenerUsuariosRegistrados();
    const userNorm = String(nuevoUsuario.usuario || nuevoUsuario.username || '').toLowerCase().trim();
    const emailNorm = String(nuevoUsuario.email || '').toLowerCase().trim();

    const yaExiste = listaUsuarios.some(u => {
      const uUser = String(u.usuario || u.username || '').toLowerCase().trim();
      const uEmail = String(u.email || '').toLowerCase().trim();
      return uUser === userNorm || (emailNorm !== '' && uEmail !== '' && uEmail === emailNorm);
    });

    if (yaExiste) return false;

    listaUsuarios.push(nuevoUsuario);
    localStorage.setItem('usuariosRegistrados', JSON.stringify(listaUsuarios));
    return true;
  } catch (e) {
    return false;
  }
}

function mostrarMensajeAlerta(el, msj, tipo = 'error') {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${tipo === 'ok' ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}