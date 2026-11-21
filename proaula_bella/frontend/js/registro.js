// js/registro.js - Registro real en MySQL sin cuentas quemadas ni usuarios ficticios en localStorage

const ROLES_REGISTRO = typeof ROLES !== 'undefined' ? ROLES : {
  cliente: { titulo: 'Clienta', imagen: 'img/rol_clienta.svg' },
  estilista: { titulo: 'Estilista', imagen: 'img/logo.webp' },
  admin: { titulo: 'Administradora', imagen: 'img/logo.webp' }
};

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
  const form = document.getElementById('formRegistro');
  if (!form) return;

  // Mientras escribe: el nombre solo acepta letras y espacios, y el teléfono solo números
  const soloPermitido = (id, quitar) => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener('input', () => {
      const limpio = campo.value.replace(quitar, '');
      if (limpio !== campo.value) campo.value = limpio;
    });
  };
  soloPermitido('nombre', /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g);
  soloPermitido('telefono', /\D/g);

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

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{2,100}$/.test(nombre)) {
      mostrarMensajeAlerta(alerta, 'El nombre solo puede tener letras y espacios.', 'error');
      return;
    }

    const telVal = document.getElementById('telefono')?.value.trim() || '';
    if (!telVal && !emailVal) {
      mostrarMensajeAlerta(alerta, 'Escribe tu teléfono o tu correo: los necesitarás para recuperar la contraseña.', 'error');
      return;
    }

    if (/\s/.test(userVal) || userVal.length < 3) {
      mostrarMensajeAlerta(alerta, 'El usuario debe tener al menos 3 caracteres y no contener espacios.', 'error');
      return;
    }

    const rolNormalizado = normalizarClaveRol(rolActual);

    const datos = {
      rol: rolNormalizado,
      nombre: nombre,
      usuario: userVal,
      username: userVal,
      email: emailVal,
      telefono: telVal,
      password: password
    };

    if (rolNormalizado === 'cliente') {
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

    try {
      let respuesta = null;
      if (typeof pedir === 'function') {
        respuesta = await pedir('/register', 'POST', datos);
        const esRutaNoEncontrada = respuesta && !respuesta.success && !respuesta.errorRed &&
          /no encontrada|not found|cannot post/i.test(respuesta.mensaje || respuesta.message || '');
        if (esRutaNoEncontrada) {
          respuesta = await pedir('/registro', 'POST', datos);
        }
      } else {
        const resHttp = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        respuesta = await resHttp.json();
        if (!resHttp.ok) respuesta.success = false;
      }

      if (!respuesta || respuesta.errorRed) {
        mostrarMensajeAlerta(alerta, 'No se pudo conectar con el servidor. Verifica que esté activo.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      if (!respuesta.success) {
        mostrarMensajeAlerta(alerta, respuesta.mensaje || respuesta.message || 'No se pudo completar el registro.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      const usuarioServidor = respuesta.user || respuesta.usuario;
      const usuarioSesion = usuarioServidor
        ? { ...usuarioServidor, rol: normalizarClaveRol(usuarioServidor.rol || rolNormalizado) }
        : crearSesionSinClave(datos);

      delete usuarioSesion.password;
      if (respuesta.token) localStorage.setItem('token', respuesta.token);
      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioSesion));

      const destinoRedireccion = rolNormalizado === 'admin'
        ? 'admin.html'
        : `panel.html?rol=${rolNormalizado}`;

      mostrarMensajeAlerta(alerta, `Cuenta registrada como ${obtenerNombreLegibleRol(rolNormalizado)}. Redirigiendo a tu panel...`, 'ok');
      setTimeout(() => { window.location.replace(destinoRedireccion); }, 1100);
    } catch (err) {
      mostrarMensajeAlerta(alerta, 'Error inesperado al procesar el registro.', 'error');
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

function mostrarMensajeAlerta(el, msj, tipo = 'error') {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${tipo === 'ok' ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}