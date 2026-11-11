// js/registro.js - Registro de usuarios con persistencia local y compatibilidad total de backend

const ROLES_REGISTRO = typeof ROLES !== 'undefined' ? ROLES : {
  cliente: { titulo: 'Clienta', imagen: 'img/rol_clienta.svg' },
  estilista: { titulo: 'Estilista', imagen: 'img/logo.webp' },
  admin: { titulo: 'Administradora', imagen: 'img/logo.webp' }
};

let rolActual = new URLSearchParams(window.location.search).get('rol');
if (!ROLES_REGISTRO[rolActual]) rolActual = 'cliente';

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
      <input type="checkbox" name="servicio" value="${s.id_servicio}" class="accent-pink-500 rounded">
      <span class="text-white">${funcEscapar(s.nombre)}</span>
    </label>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRegistro');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnRegistrar');

    const nombre = document.getElementById('nombre').value.trim();
    const userVal = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    if (!nombre || !userVal || !password) {
      mostrarMensajeAlerta(alerta, 'Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    const datos = {
      rol: rolActual,
      nombre: nombre,
      usuario: userVal,
      username: userVal,
      password: password
    };

    if (rolActual === 'cliente') {
      datos.telefono = document.getElementById('telefono')?.value.trim() || '';
      datos.email = document.getElementById('email')?.value.trim() || '';
      datos.profesion = document.getElementById('profesion')?.value.trim() || '';
    } else if (rolActual === 'estilista') {
      datos.servicios = [...document.querySelectorAll('input[name="servicio"]:checked')].map((c) => Number(c.value));
      datos.especialidad = 'Estilista Profesional';
    } else if (rolActual === 'admin') {
      const cod = document.getElementById('codigo')?.value || '';
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
    } catch (err) {
      console.warn('Backend sin conexión, activando modo demostración.');
    }

    // 1. Guardar en la lista global de usuarios registrados (para disponibilizar estilistas en agendar.html)
    guardarEnUsuariosRegistrados(datos);

    // 2. Definir redirección según el rol
    const esAdmin = rolActual === 'admin' || rolActual === 'administradora';
    const destinoRedireccion = esAdmin ? 'admin.html' : 'panel.html';

    if (respuesta && respuesta.success) {
      const usuarioSesion = respuesta.usuario || datos;
      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioSesion));
      mostrarMensajeAlerta(alerta, (respuesta.message || respuesta.mensaje || '¡Cuenta creada con éxito!') + ' Redirigiendo...', 'ok');
      setTimeout(() => { window.location.href = destinoRedireccion; }, 1200);
    } else if (!respuesta || respuesta.errorRed) {
      localStorage.setItem('usuarioLogueado', JSON.stringify(datos));
      mostrarMensajeAlerta(alerta, '¡Registro completado! Redirigiendo a tu panel...', 'ok');
      setTimeout(() => { window.location.href = destinoRedireccion; }, 1200);
    } else {
      mostrarMensajeAlerta(alerta, respuesta.mensaje || respuesta.message || 'Error al procesar la solicitud. Verifica los datos introducidos.', 'error');
      if (boton) boton.disabled = false;
    }
  });

  cambiarRol(rolActual);
  cargarServicios();
});

/**
 * Persiste los datos del nuevo usuario registrado en localStorage para consultas offline/demo.
 */
function guardarEnUsuariosRegistrados(nuevoUsuario) {
  try {
    const listaUsuarios = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];
    const existeIndice = listaUsuarios.findIndex(u => u.usuario === nuevoUsuario.usuario || u.username === nuevoUsuario.username);

    if (existeIndice !== -1) {
      listaUsuarios[existeIndice] = { ...listaUsuarios[existeIndice], ...nuevoUsuario };
    } else {
      listaUsuarios.push(nuevoUsuario);
    }

    localStorage.setItem('usuariosRegistrados', JSON.stringify(listaUsuarios));
  } catch (e) {
    console.error('Error al guardar usuario en localStorage:', e);
  }
}

function mostrarMensajeAlerta(el, msj, tipo = 'error') {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${tipo === 'ok' ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}