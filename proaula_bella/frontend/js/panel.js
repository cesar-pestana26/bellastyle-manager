// js/panel.js - Lógica del Panel Privado (Clientas, Estilistas y Pagos)

let usuarioSesion = null;
let citasUsuario = [];
let serviciosGlobales = [];

document.addEventListener('DOMContentLoaded', async () => {
  obtenerSesionValida();
  configurarHeader();
  await cargarDatosIniciales();

  const rolNorm = String(usuarioSesion.rol || '').toLowerCase();

  if (rolNorm.includes('estilista')) {
    iniciarVistaEstilista();
  } else {
    iniciarVistaClienta();
  }
});

function obtenerSesionValida() {
  try {
    usuarioSesion = JSON.parse(localStorage.getItem('usuarioLogueado'));
  } catch (e) {
    usuarioSesion = null;
  }

  if (!usuarioSesion) {
    window.location.replace('index.html');
  }
}

function configurarHeader() {
  const nombreEl = document.getElementById('nombreUsuarioPanel');
  const badgeEl = document.getElementById('badgeRolPanel');
  const tituloSaludo = document.getElementById('tituloSaludo');
  const subtituloPanel = document.getElementById('subtituloPanel');

  const rolNorm = String(usuarioSesion.rol || '').toLowerCase();
  const esEstilista = rolNorm.includes('estilista');

  if (nombreEl) nombreEl.textContent = usuarioSesion.nombre || usuarioSesion.usuario;
  if (badgeEl) {
    badgeEl.textContent = esEstilista ? 'Estilista' : 'Clienta';
    badgeEl.className = `text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
      esEstilista ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    }`;
  }

  if (tituloSaludo) {
    tituloSaludo.textContent = `Hola, ${usuarioSesion.nombre || usuarioSesion.usuario}`;
  }

  if (subtituloPanel) {
    subtituloPanel.textContent = esEstilista 
      ? 'Consulta tu agenda de citas asignadas y métricas de desempeño.'
      : 'Revisa tus citas agendadas, realiza pagos y descarga tus comprobantes.';
  }

  const btnAgendar = document.getElementById('btnAgendarHeader');
  if (btnAgendar && esEstilista) {
    btnAgendar.style.display = 'none';
  }
}

async function cargarDatosIniciales() {
  serviciosGlobales = [
    { id_servicio: 1, nombre: 'Corte de Cabello', precio: 35000 },
    { id_servicio: 2, nombre: 'Tinte / Coloración', precio: 90000 },
    { id_servicio: 3, nombre: 'Mechas / Balayage', precio: 180000 },
    { id_servicio: 4, nombre: 'Peinado para Evento', precio: 70000 },
    { id_servicio: 5, nombre: 'Manicure', precio: 45000 },
    { id_servicio: 6, nombre: 'Pedicure', precio: 40000 },
    { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 150000 }
  ];

  citasUsuario = [
    { id: 101, cliente: usuarioSesion.nombre || 'Mariana Sofía', servicio: 'Mechas / Balayage', estilista: 'Diana Carmen', fecha: obtenerFechaHoy(), hora: '10:00 AM', estado: 'Confirmada', precio: 180000 },
    { id: 102, cliente: usuarioSesion.nombre || 'Mariana Sofía', servicio: 'Manicure', estilista: 'Sofía Martínez', fecha: obtenerFechaHoy(), hora: '03:00 PM', estado: 'Pendiente', precio: 45000 }
  ];

  try {
    if (typeof pedir === 'function') {
      const resp = await pedir(`/citas?idUsuario=${usuarioSesion.usuario || usuarioSesion.id}`, 'GET');
      if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        citasUsuario = resp.data;
      }
    }
  } catch (e) {}
}

/* ==========================================================================
   VISTA CLIENTA
   ========================================================================== */

function iniciarVistaClienta() {
  const vClienta = document.getElementById('vistaClienta');
  const vEstilista = document.getElementById('vistaEstilista');

  if (vClienta) vClienta.classList.remove('hidden');
  if (vEstilista) vEstilista.classList.add('hidden');

  renderizarDatosClienta();
  renderizarTablaCitasClienta();

  document.getElementById('btnEditarMisDatos')?.addEventListener('click', modalEditarDatosClienta);
}

function renderizarDatosClienta() {
  const contenedor = document.getElementById('misDatosClienta');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div><span class="text-white/50">Nombre:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.nombre || usuarioSesion.usuario)}</strong></div>
    <div><span class="text-white/50">Usuario:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.usuario)}</strong></div>
    <div><span class="text-white/50">Teléfono:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.telefono || '3001234567')}</strong></div>
    <div><span class="text-white/50">Correo:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.email || 'clienta@bellastyle.com')}</strong></div>
    <div><span class="text-white/50">Profesión:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.profesion || 'No especificada')}</strong></div>
  `;
}

function renderizarTablaCitasClienta() {
  const tabla = document.getElementById('tablaCitasClienta') || document.getElementById('tablaCitasPanel');
  if (!tabla) return;

  if (citasUsuario.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-white/50">No tienes citas agendadas aún.</td></tr>`;
    return;
  }

  tabla.innerHTML = citasUsuario.map(c => {
    const pago = typeof obtenerPagoPorCita === 'function' ? obtenerPagoPorCita(c.id) : null;
    const estaPagada = pago && pago.estado_pago === 'Pagado';
    const pendienteSalon = pago && pago.estado_pago === 'Pendiente en Salón';

    let badgePago = `<span class="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/10 text-white/60">Sin pagar</span>`;
    if (estaPagada) {
      badgePago = `<span class="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Pagado</span>`;
    } else if (pendienteSalon) {
      badgePago = `<span class="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">En Salón</span>`;
    }

    const botonPago = estaPagada
      ? `<button onclick="verComprobantePago(${c.id})" class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30">Recibo</button>`
      : (c.estado !== 'Cancelada'
          ? `<button onclick="iniciarPagoCitaClienta(${c.id})" class="px-2.5 py-1 bg-pink-500 text-white rounded text-[11px] font-bold hover:bg-pink-600 shadow-sm">Pagar</button>`
          : '');

    return `
      <tr class="hover:bg-white/5 transition border-b border-white/5">
        <td class="p-3.5 font-bold text-white">${escapar(c.servicio)} ${badgePago}</td>
        <td class="p-3.5 text-white/80">${escapar(c.estilista)}</td>
        <td class="p-3.5 text-pink-300 font-semibold whitespace-nowrap">${c.fecha} · ${c.hora}</td>
        <td class="p-3.5">${formatearEstadoBadge(c.estado)}</td>
        <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
          ${botonPago}
          ${c.estado === 'Confirmada' || c.estado === 'Pendiente' ? `<button onclick="cancelarCitaClienta(${c.id})" class="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30">Cancelar</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.iniciarPagoCitaClienta = function(idCita) {
  const cita = citasUsuario.find(c => c.id === idCita);
  if (!cita || typeof abrirPasarelaPago !== 'function') return;

  abrirPasarelaPago(cita, () => {
    mostrarToast('Pago registrado correctamente');
    renderizarTablaCitasClienta();
  });
};

window.cancelarCitaClienta = async function(idCita) {
  if (confirm('¿Deseas cancelar esta cita?')) {
    const cita = citasUsuario.find(c => c.id === idCita);
    if (cita) cita.estado = 'Cancelada';

    try {
      if (typeof pedir === 'function') {
        await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: 'Cancelada' });
      }
    } catch (e) {}

    mostrarToast('Cita cancelada correctamente');
    renderizarTablaCitasClienta();
  }
};

function modalEditarDatosClienta() {
  abrirVentana('Editar Mis Datos',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombre Completo</label>
        <input id="vEditNombre" type="text" value="${usuarioSesion.nombre || ''}" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Teléfono</label>
        <input id="vEditTel" type="text" value="${usuarioSesion.telefono || '3001234567'}" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Correo Electrónico</label>
        <input id="vEditEmail" type="email" value="${usuarioSesion.email || ''}" class="campo">
      </div>
    </div>`,
    async () => {
      usuarioSesion.nombre = document.getElementById('vEditNombre').value.trim();
      usuarioSesion.telefono = document.getElementById('vEditTel').value.trim();
      usuarioSesion.email = document.getElementById('vEditEmail').value.trim();

      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioSesion));
      configurarHeader();
      renderizarDatosClienta();
      mostrarToast('Datos actualizados correctamente');
      return true;
    }
  );
}

/* ==========================================================================
   VISTA ESTILISTA
   ========================================================================== */

function iniciarVistaEstilista() {
  const vClienta = document.getElementById('vistaClienta');
  const vEstilista = document.getElementById('vistaEstilista');

  if (vEstilista) vEstilista.classList.remove('hidden');
  if (vClienta) vClienta.classList.add('hidden');

  renderizarMetricasEstilista();
  renderizarTablaCitasEstilista();

  document.getElementById('btnEditarMisServicios')?.addEventListener('click', modalServiciosEstilista);
  document.getElementById('btnEditarMiHorario')?.addEventListener('click', modalHorarioEstilista);
}

function renderizarMetricasEstilista() {
  const contenedor = document.getElementById('metricasEstilista');
  if (!contenedor) return;

  const totalCitas = citasUsuario.length;
  const pendientes = citasUsuario.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada').length;
  const finalizadas = citasUsuario.filter(c => c.estado === 'Finalizada').length;
  const ingresosBrutos = citasUsuario.filter(c => c.estado === 'Finalizada').reduce((sum, c) => sum + (c.precio || 0), 0);
  const miComision = ingresosBrutos * 0.60;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  contenedor.innerHTML = `
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-bold text-xl">📅</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Total Citas</span>
        <strong class="text-2xl font-serif text-white">${totalCitas}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xl">⏳</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Por Atender</span>
        <strong class="text-2xl font-serif text-amber-300">${pendientes}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">✅</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Finalizadas</span>
        <strong class="text-2xl font-serif text-emerald-300">${finalizadas}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xl">💵</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Mi Comisión (60%)</span>
        <strong class="text-2xl font-serif text-purple-300">${fmt(miComision)}</strong>
      </div>
    </div>
  `;
}

function renderizarTablaCitasEstilista() {
  const tabla = document.getElementById('tablaCitasEstilista');
  if (!tabla) return;

  if (citasUsuario.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-white/50">No tienes citas asignadas en tu agenda.</td></tr>`;
    return;
  }

  tabla.innerHTML = citasUsuario.map(c => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">BS-${c.id}</td>
      <td class="p-3.5 font-bold text-white">${escapar(c.cliente)}</td>
      <td class="p-3.5 text-white/80">${escapar(c.servicio)}</td>
      <td class="p-3.5 text-pink-300 font-semibold whitespace-nowrap">${c.fecha} · ${c.hora}</td>
      <td class="p-3.5">${formatearEstadoBadge(c.estado)}</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        ${c.estado === 'Pendiente' ? `<button onclick="cambiarEstadoEstilista(${c.id}, 'Confirmada')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold">Confirmar</button>` : ''}
        ${c.estado === 'Confirmada' ? `<button onclick="cambiarEstadoEstilista(${c.id}, 'Finalizada')" class="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold">Finalizar</button>` : ''}
      </td>
    </tr>
  `).join('');
}

window.cambiarEstadoEstilista = async function(idCita, nuevoEstado) {
  const cita = citasUsuario.find(c => c.id === idCita);
  if (cita) cita.estado = nuevoEstado;

  try {
    if (typeof pedir === 'function') {
      await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: nuevoEstado });
    }
  } catch (e) {}

  mostrarToast(`Cita marcada como ${nuevoEstado}`);
  renderizarMetricasEstilista();
  renderizarTablaCitasEstilista();
};

function modalServiciosEstilista() {
  abrirVentana('Mis Servicios de Especialidad',
    `<p class="text-xs text-white/70 mb-3">Selecciona los servicios que puedes ofrecer:</p>
     <div class="space-y-2 text-xs">
       ${serviciosGlobales.map(s => `
         <label class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
           <input type="checkbox" checked class="accent-pink-500">
           <span class="text-white">${s.nombre}</span>
         </label>
       `).join('')}
     </div>`,
    async () => {
      mostrarToast('Especialidades guardadas');
      return true;
    }
  );
}

function modalHorarioEstilista() {
  abrirVentana('Mi Horario de Atención',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Hora Inicio Jornada</label>
        <input type="time" value="08:00" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Hora Cierre Jornada</label>
        <input type="time" value="18:00" class="campo">
      </div>
    </div>`,
    async () => {
      mostrarToast('Horario actualizado');
      return true;
    }
  );
}

/* ==========================================================================
   AUXILIARES Y MODALES
   ========================================================================== */

let alGuardarVentana = null;

function abrirVentana(titulo, html, alGuardar) {
  const tit = document.getElementById('tituloVentana');
  const camp = document.getElementById('camposVentana');
  if (tit) tit.textContent = titulo;
  if (camp) camp.innerHTML = html;

  alGuardarVentana = alGuardar;

  const ventana = document.getElementById('ventana');
  if (ventana && !ventana.open) ventana.showModal();
}

window.cerrarVentana = function() {
  const ventana = document.getElementById('ventana');
  if (ventana) ventana.close();
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formVentana');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!alGuardarVentana) return;
      const ok = await alGuardarVentana();
      if (ok) cerrarVentana();
    });
  }
});

function formatearEstadoBadge(estado) {
  const estilos = {
    Pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Finalizada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const cls = estilos[estado] || 'bg-white/10 text-white/80 border-white/20';
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}">${estado}</span>`;
}

function mostrarToast(msj) {
  const av = document.getElementById('aviso');
  if (!av) return;
  av.textContent = msj;
  av.classList.remove('opacity-0', '-translate-y-4');
  clearTimeout(av.timer);
  av.timer = setTimeout(() => av.classList.add('opacity-0', '-translate-y-4'), 3000);
}

function obtenerFechaHoy() {
  const hoy = new Date();
  return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapar(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.cerrarSesionPanel = function() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.replace('index.html');
};