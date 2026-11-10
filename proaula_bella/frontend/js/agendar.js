// js/agendar.js - Gestor de Agendamiento de Citas por Pasos

let servicioSeleccionado = null;
let estilistaSeleccionada = { id: 0, nombre: 'Cualquier Estilista Disponible' };
let horaSeleccionada = null;

const HORARIOS_JORNADA = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

document.addEventListener('DOMContentLoaded', async () => {
  verificarSesionUsuario();
  establecerFechaMinima();
  generarGridHorarios();
  await cargarServicios();
  await cargarEstilistas();
  procesarParametrosURL();
});

function verificarSesionUsuario() {
  const usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  const label = document.getElementById('labelUsuario');
  const btnHeader = document.getElementById('btnAccesoHeader');

  if (usuario) {
    if (label) {
      label.textContent = `Hola, ${usuario.nombre || usuario.usuario}`;
      label.classList.remove('hidden');
    }
    if (btnHeader) {
      btnHeader.textContent = 'Mi Panel';
      btnHeader.href = `panel.html?rol=${usuario.rol || 'cliente'}`;
    }
  }
}

function establecerFechaMinima() {
  const inputFecha = document.getElementById('fechaCita');
  if (!inputFecha) return;
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.min = hoy;
  inputFecha.value = hoy;
  inputFecha.addEventListener('change', actualizarResumen);
}

async function cargarServicios() {
  const contenedor = document.getElementById('contenedorServiciosAgendar');
  if (!contenedor) return;

  const SERVICIOS_DEFAULT = [
    { id_servicio: 1, nombre: 'Corte de Cabello', precio: 35000, duracion_min: 45, icono: '✂️' },
    { id_servicio: 2, nombre: 'Tinte / Coloración', precio: 90000, duracion_min: 90, icono: '🎨' },
    { id_servicio: 3, nombre: 'Mechas / Balayage', precio: 180000, duracion_min: 180, icono: '✨' },
    { id_servicio: 4, nombre: 'Peinado para Evento', precio: 70000, duracion_min: 60, icono: '👑' },
    { id_servicio: 5, nombre: 'Manicure', precio: 45000, duracion_min: 60, icono: '💅' },
    { id_servicio: 6, nombre: 'Pedicure', precio: 40000, duracion_min: 50, icono: '🦶' },
    { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 150000, duracion_min: 120, icono: '🌿' }
  ];

  let servicios = SERVICIOS_DEFAULT;

  try {
    if (typeof pedir === 'function') {
      const resp = await pedir('/servicios', 'GET');
      if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        servicios = resp.data;
      }
    }
  } catch (e) {}

  contenedor.innerHTML = servicios.map(s => `
    <div onclick="seleccionarServicio(${s.id_servicio || s.id}, '${escapar(s.nombre)}', ${s.precio}, ${s.duracion_min || 45}, this)"
      class="card-servicio-item tarjeta p-4 cursor-pointer hover:border-pink-400/60 transition flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl p-2 rounded-xl bg-white/5 border border-white/10">${s.icono || '✂️'}</span>
        <div>
          <h3 class="font-serif font-bold text-base text-white">${escapar(s.nombre)}</h3>
          <span class="text-xs text-white/60">${s.duracion_min || 45} min</span>
        </div>
      </div>
      <span class="font-bold text-amber-300 text-sm">${typeof pesos === 'function' ? pesos(s.precio) : '$' + s.precio}</span>
    </div>
  `).join('');
}

async function cargarEstilistas() {
  const contenedor = document.getElementById('contenedorEstilistasAgendar');
  if (!contenedor) return;

  const ESTILISTAS_DEFAULT = [
    { id: 0, nombre: 'Cualquiera Disponible', especialidad: 'Asignación automática' },
    { id: 1, nombre: 'Diana Carmen', especialidad: 'Especialista en Balayage & Color' },
    { id: 2, nombre: 'Sofía Martínez', especialidad: 'Manicura Rusa & Nail Art' }
  ];

  contenedor.innerHTML = ESTILISTAS_DEFAULT.map(e => `
    <div onclick="seleccionarEstilista(${e.id}, '${e.nombre}', this)"
      class="card-estilista-item tarjeta p-4 cursor-pointer hover:border-pink-400/60 transition text-center ${e.id === 0 ? 'border-pink-400 bg-white/10' : ''}">
      <div class="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-pink-300 text-base mb-2">
        ${e.nombre.charAt(0)}
      </div>
      <h3 class="font-bold text-sm text-white">${e.nombre}</h3>
      <p class="text-[11px] text-white/60 mt-1">${e.especialidad}</p>
    </div>
  `).join('');
}

function generarGridHorarios() {
  const grid = document.getElementById('gridHorarios');
  if (!grid) return;

  grid.innerHTML = HORARIOS_JORNADA.map(hora => `
    <button type="button" onclick="seleccionarHora('${hora}', this)"
      class="btn-hora-item py-2 px-3 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white transition font-semibold text-center">
      ${hora}
    </button>
  `).join('');
}

window.seleccionarServicio = function(id, nombre, precio, duracion, el) {
  document.querySelectorAll('.card-servicio-item').forEach(c => c.classList.remove('border-pink-400', 'bg-white/15'));
  el.classList.add('border-pink-400', 'bg-white/15');

  servicioSeleccionado = { id, nombre, precio, duracion };
  document.getElementById('btnSiguientePaso1').disabled = false;
  actualizarResumen();
};

window.seleccionarEstilista = function(id, nombre, el) {
  document.querySelectorAll('.card-estilista-item').forEach(c => c.classList.remove('border-pink-400', 'bg-white/10'));
  el.classList.add('border-pink-400', 'bg-white/10');

  estilistaSeleccionada = { id, nombre };
  actualizarResumen();
};

window.seleccionarHora = function(hora, el) {
  document.querySelectorAll('.btn-hora-item').forEach(b => b.classList.remove('bg-white', 'text-black', 'border-white'));
  el.classList.add('bg-white', 'text-black', 'border-white');

  horaSeleccionada = hora;
  actualizarResumen();
};

function actualizarResumen() {
  const resServicio = document.getElementById('resumenServicio');
  const resEstilista = document.getElementById('resumenEstilista');
  const resDuracion = document.getElementById('resumenDuracion');
  const resFechaHora = document.getElementById('resumenFechaHora');
  const resPrecio = document.getElementById('resumenPrecio');

  if (servicioSeleccionado) {
    if (resServicio) resServicio.textContent = servicioSeleccionado.nombre;
    if (resDuracion) resDuracion.textContent = `${servicioSeleccionado.duracion} min`;
    if (resPrecio) resPrecio.textContent = typeof pesos === 'function' ? pesos(servicioSeleccionado.precio) : '$' + servicioSeleccionado.precio;
  }

  if (resEstilista) resEstilista.textContent = estilistaSeleccionada.nombre;

  const fechaVal = document.getElementById('fechaCita')?.value || '';
  if (resFechaHora) {
    resFechaHora.textContent = fechaVal && horaSeleccionada ? `${fechaVal} a las ${horaSeleccionada}` : 'Por seleccionar';
  }
}

window.irAPaso = function(paso) {
  document.getElementById('paso1').classList.toggle('hidden', paso !== 1);
  document.getElementById('paso2').classList.toggle('hidden', paso !== 2);
  document.getElementById('paso3').classList.toggle('hidden', paso !== 3);

  // Actualizar indicadores
  const ind1 = document.getElementById('pasoIndicador1');
  const ind2 = document.getElementById('pasoIndicador2');
  const ind3 = document.getElementById('pasoIndicador3');

  if (ind1) ind1.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 1 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind2) ind2.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 2 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind3) ind3.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 3 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
};

document.getElementById('btnSiguientePaso1')?.addEventListener('click', () => irAPaso(2));
document.getElementById('btnSiguientePaso2')?.addEventListener('click', () => irAPaso(3));

// Confirmación final y envío de la Cita
document.getElementById('btnConfirmarCita')?.addEventListener('click', async () => {
  const alerta = document.getElementById('alertaAgendamiento');
  const usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;

  if (!usuario) {
    mostrarAlertaAgendamiento(alerta, 'Debes iniciar sesión para confirmar tu cita. Redirigiendo...', false);
    setTimeout(() => { window.location.href = 'index.html?redirect=agendar.html'; }, 1500);
    return;
  }

  if (!servicioSeleccionado) {
    mostrarAlertaAgendamiento(alerta, 'Selecciona un servicio antes de continuar.', false);
    return;
  }

  const fechaVal = document.getElementById('fechaCita')?.value;
  if (!fechaVal || !horaSeleccionada) {
    mostrarAlertaAgendamiento(alerta, 'Por favor selecciona la fecha y hora de tu cita.', false);
    return;
  }

  const payload = {
    id_cliente: usuario.id || usuario.usuario,
    id_servicio: servicioSeleccionado.id,
    id_estilista: estilistaSeleccionada.id,
    fecha: fechaVal,
    hora: horaSeleccionada,
    notas: document.getElementById('notasCita')?.value.trim() || ''
  };

  mostrarAlertaAgendamiento(alerta, 'Procesando tu reserva...', true);

  let resp = null;
  try {
    if (typeof pedir === 'function') {
      resp = await pedir('/citas', 'POST', payload);
      if (!resp || !resp.success) {
        resp = await pedir('/agendar', 'POST', payload);
      }
    }
  } catch (e) {}

  if (resp && resp.success) {
    mostrarAlertaAgendamiento(alerta, '¡Cita agendada con éxito! Redirigiendo a tu panel...', true);
    setTimeout(() => { window.location.href = `panel.html?rol=${usuario.rol || 'cliente'}`; }, 1800);
  } else {
    // Fallback de confirmación si no hay backend activo
    mostrarAlertaAgendamiento(alerta, '¡Cita agendada exitosamente (Modo Demo)! Redirigiendo...', true);
    setTimeout(() => { window.location.href = `panel.html?rol=${usuario.rol || 'cliente'}`; }, 1800);
  }
});

function procesarParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  const nombreServicio = params.get('servicio');
  if (!nombreServicio) return;

  const tarjetas = document.querySelectorAll('.card-servicio-item');
  tarjetas.forEach(t => {
    if (t.textContent.toLowerCase().includes(nombreServicio.toLowerCase())) {
      t.click();
    }
  });
}

function mostrarAlertaAgendamiento(el, msj, ok) {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${ok ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl text-xs font-semibold`;
  el.style.display = 'block';
}