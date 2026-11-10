// js/admin.js - Control Exclusivo del Panel de Administración

let citasGlobales = [];
let serviciosGlobales = [];
let estilistasGlobales = [];

document.addEventListener('DOMContentLoaded', async () => {
  verificarAccesoAdmin();

  document.getElementById('fechaHoyAdmin').textContent = new Date().toLocaleDateString('es-CO', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  await cargarDatosAdministrador();
  renderizarMetricasGanancias();
  renderizarTablaCitas();
  renderizarTablaGanancias();
  renderizarTablaServicios();
  poblarFiltroEstilistas();
});

function verificarAccesoAdmin() {
  const usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  const nombreHeader = document.getElementById('nombreAdminHeader');

  if (!usuario) {
    window.location.href = 'index.html';
    return;
  }

  // Si no es administradora, redirige al panel normal
  const rolNorm = String(usuario.rol || '').toLowerCase();
  if (!rolNorm.includes('admin')) {
    window.location.href = 'panel.html';
    return;
  }

  if (nombreHeader) nombreHeader.textContent = usuario.nombre || usuario.usuario;
}

async function cargarDatosAdministrador() {
  // Datos base con fallback seguro
  citasGlobales = [
    { id: 101, cliente: 'Ana María López', servicio: 'Mechas / Balayage', id_servicio: 3, estilista: 'Diana Carmen', id_estilista: 1, fecha: obtenerFechaHoy(), hora: '10:00 AM', valor: 180000, estado: 'Finalizada' },
    { id: 102, cliente: 'Martina Flórez', servicio: 'Manicure', id_servicio: 5, estilista: 'Sofía Martínez', id_estilista: 2, fecha: obtenerFechaHoy(), hora: '11:30 AM', valor: 45000, estado: 'Confirmada' },
    { id: 103, cliente: 'Laura Gómez', servicio: 'Corte de Cabello', id_servicio: 1, estilista: 'Diana Carmen', id_estilista: 1, fecha: obtenerFechaHoy(), hora: '02:00 PM', valor: 35000, estado: 'Pendiente' },
    { id: 104, cliente: 'Carolina Ruiz', servicio: 'Tinte / Coloración', id_servicio: 2, estilista: 'Diana Carmen', id_estilista: 1, fecha: obtenerFechaHoy(), hora: '04:00 PM', valor: 90000, estado: 'Finalizada' }
  ];

  serviciosGlobales = [
    { id_servicio: 1, nombre: 'Corte de Cabello', precio: 35000, duracion_min: 45 },
    { id_servicio: 2, nombre: 'Tinte / Coloración', precio: 90000, duracion_min: 90 },
    { id_servicio: 3, nombre: 'Mechas / Balayage', precio: 180000, duracion_min: 180 },
    { id_servicio: 4, nombre: 'Peinado para Evento', precio: 70000, duracion_min: 60 },
    { id_servicio: 5, nombre: 'Manicure', precio: 45000, duracion_min: 60 },
    { id_servicio: 6, nombre: 'Pedicure', precio: 40000, duracion_min: 50 },
    { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 150000, duracion_min: 120 }
  ];

  estilistasGlobales = [
    { id: 1, nombre: 'Diana Carmen' },
    { id: 2, nombre: 'Sofía Martínez' }
  ];

  try {
    if (typeof pedir === 'function') {
      const [resC, resS, resE] = await Promise.all([
        pedir('/citas?rol=Administradora', 'GET').catch(() => null),
        pedir('/servicios', 'GET').catch(() => null),
        pedir('/estilistas', 'GET').catch(() => null)
      ]);

      if (resC && resC.success && Array.isArray(resC.data) && resC.data.length > 0) citasGlobales = resC.data;
      if (resS && resS.success && Array.isArray(resS.data) && resS.data.length > 0) serviciosGlobales = resS.data;
      if (resE && resE.success && Array.isArray(resE.data) && resE.data.length > 0) estilistasGlobales = resE.data;
    }
  } catch (e) {}
}

/* ==========================================================================
   1. MÉTRICAS FINANCIERAS Y DE CITAS
   ========================================================================== */

function renderizarMetricasGanancias() {
  const contenedor = document.getElementById('metricasAdminPanel');
  if (!contenedor) return;

  const totalCitas = citasGlobales.length;
  const citasHoy = citasGlobales.filter(c => c.fecha === obtenerFechaHoy()).length;
  
  const ingresosBrutos = citasGlobales
    .filter(c => c.estado === 'Finalizada')
    .reduce((acc, c) => acc + (Number(c.valor) || Number(c.precio) || 0), 0);

  const gananciaSalon = ingresosBrutos * 0.40;
  const pagoEstilistas = ingresosBrutos * 0.60;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  contenedor.innerHTML = `
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-bold text-xl">📅</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Total Citas</span>
        <strong class="text-2xl font-serif text-white">${totalCitas} <span class="text-xs text-pink-400 font-sans font-normal">(${citasHoy} hoy)</span></strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">💵</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Ingresos Brutos</span>
        <strong class="text-2xl font-serif text-emerald-300">${fmt(ingresosBrutos)}</strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xl">🏢</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Ganancia Salón (40%)</span>
        <strong class="text-2xl font-serif text-amber-300">${fmt(gananciaSalon)}</strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xl">✂️</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Comisiones Estilistas (60%)</span>
        <strong class="text-2xl font-serif text-purple-300">${fmt(pagoEstilistas)}</strong>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2. CONTROL Y FILTRADO DE CITAS
   ========================================================================== */

function renderizarTablaCitas(lista = null) {
  const tabla = document.getElementById('tablaCitasAdmin');
  if (!tabla) return;

  const citas = lista || citasGlobales;
  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  if (citas.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-white/50">No hay citas registradas.</td></tr>`;
    return;
  }

  tabla.innerHTML = citas.map(c => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">BS-${c.id}</td>
      <td class="p-3.5 font-bold text-white">${escapar(c.cliente)}</td>
      <td class="p-3.5 text-white/80">${escapar(c.servicio)}</td>
      <td class="p-3.5 text-pink-300 font-semibold">${escapar(c.estilista)}</td>
      <td class="p-3.5 text-white/90 whitespace-nowrap">${c.fecha} · ${c.hora}</td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(c.valor || c.precio || 0)}</td>
      <td class="p-3.5">${formatearEstado(c.estado)}</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        ${c.estado === 'Pendiente' ? `<button onclick="actualizarEstado(${c.id}, 'Confirmada')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30">Confirmar</button>` : ''}
        ${c.estado === 'Confirmada' ? `<button onclick="actualizarEstado(${c.id}, 'Finalizada')" class="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold hover:bg-blue-500/30">Finalizar</button>` : ''}
        ${c.estado !== 'Cancelada' && c.estado !== 'Finalizada' ? `<button onclick="actualizarEstado(${c.id}, 'Cancelada')" class="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30">Cancelar</button>` : ''}
        <button onclick="modalReasignar(${c.id})" class="px-2 py-1 bg-white/10 text-white hover:bg-white/20 rounded text-[11px] font-semibold">Reasignar</button>
      </td>
    </tr>
  `).join('');
}

window.filtrarCitasAdmin = function() {
  const est = document.getElementById('filtroEstado')?.value || 'todos';
  const estil = document.getElementById('filtroEstilista')?.value || 'todos';
  const txt = document.getElementById('filtroBuscar')?.value.toLowerCase().trim() || '';

  const res = citasGlobales.filter(c => {
    const coincideEstado = est === 'todos' || c.estado === est;
    const coincideEstilista = estil === 'todos' || String(c.id_estilista || c.estilista) === estil;
    const coincideTexto = !txt || c.cliente.toLowerCase().includes(txt) || c.servicio.toLowerCase().includes(txt);
    return coincideEstado && coincideEstilista && coincideTexto;
  });

  renderizarTablaCitas(res);
};

function poblarFiltroEstilistas() {
  const select = document.getElementById('filtroEstilista');
  if (!select) return;

  const opciones = estilistasGlobales.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  select.innerHTML = `<option value="todos">Todas las Estilistas</option>` + opciones;
}

window.actualizarEstado = async function(idCita, nuevoEstado) {
  const cita = citasGlobales.find(c => c.id === idCita);
  if (cita) cita.estado = nuevoEstado;

  try {
    if (typeof pedir === 'function') {
      await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: nuevoEstado });
    }
  } catch (e) {}

  notificarAdmin(`Cita BS-${idCita} actualizada a ${nuevoEstado}`);
  renderizarMetricasGanancias();
  renderizarTablaCitas();
  renderizarTablaGanancias();
};

window.modalReasignar = function(idCita) {
  const cita = citasGlobales.find(c => c.id === idCita);
  if (!cita) return;

  const opciones = estilistasGlobales.map(e => `<option value="${e.id}" ${e.nombre === cita.estilista ? 'selected' : ''}>${e.nombre}</option>`).join('');

  abrirModalAdmin(`Reasignar Cita BS-${idCita}`,
    `<div>
      <label class="text-xs text-white/70 block mb-1">Nueva estilista para la clienta ${cita.cliente}:</label>
      <select id="vNuevoEstilista" class="campo bg-[#120f1d]">${opciones}</select>
    </div>`,
    async () => {
      const selectEl = document.getElementById('vNuevoEstilista');
      const nombreNuevo = selectEl.options[selectEl.selectedIndex].text;
      cita.estilista = nombreNuevo;
      cita.id_estilista = Number(selectEl.value);

      notificarAdmin(`Estilista de cita BS-${idCita} cambiada a ${nombreNuevo}`);
      renderizarTablaCitas();
      return true;
    }
  );
};

/* ==========================================================================
   3. RENDIMIENTO Y LIQUIDACIÓN 60/40
   ========================================================================== */

function renderizarTablaGanancias() {
  const tabla = document.getElementById('tablaGananciasAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  const reporte = estilistasGlobales.map(est => {
    const citasAtendidas = citasGlobales.filter(c => (c.id_estilista === est.id || c.estilista === est.nombre) && c.estado === 'Finalizada');
    const totalRecaudado = citasAtendidas.reduce((sum, c) => sum + (Number(c.valor) || Number(c.precio) || 0), 0);
    const pagoEstilista = totalRecaudado * 0.60;
    const gananciaSalon = totalRecaudado * 0.40;

    return {
      nombre: est.nombre,
      numCitas: citasAtendidas.length,
      recaudado: totalRecaudado,
      pagoEstilista,
      gananciaSalon
    };
  });

  tabla.innerHTML = reporte.map(r => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-bold text-white">${escapar(r.nombre)}</td>
      <td class="p-3.5 text-white/80">${r.numCitas} citas completadas</td>
      <td class="p-3.5 font-bold text-emerald-300">${fmt(r.recaudado)}</td>
      <td class="p-3.5 font-semibold text-purple-300">${fmt(r.pagoEstilista)}</td>
      <td class="p-3.5 font-bold text-amber-300 text-right">${fmt(r.gananciaSalon)}</td>
    </tr>
  `).join('');
}

/* ==========================================================================
   4. GESTIÓN DE SERVICIOS
   ========================================================================== */

function renderizarTablaServicios() {
  const tabla = document.getElementById('tablaServiciosAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  tabla.innerHTML = serviciosGlobales.map(s => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">#${s.id_servicio || s.id}</td>
      <td class="p-3.5 font-bold text-white">${escapar(s.nombre)}</td>
      <td class="p-3.5 text-white/80">${s.duracion_min || 45} minutos</td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(s.precio)}</td>
      <td class="p-3.5 text-right whitespace-nowrap">
        <button onclick="modalEditarServicio(${s.id_servicio || s.id})" class="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">Editar Precio</button>
      </td>
    </tr>
  `).join('');
}

window.modalCrearServicio = function() {
  abrirModalAdmin('Crear Servicio Nuevo',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombre del Servicio</label>
        <input id="vNuevoNombreSrv" type="text" placeholder="Ej: Keratina Alisante" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Precio Público ($ COP)</label>
        <input id="vNuevoPrecioSrv" type="number" placeholder="130000" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Duración (minutos)</label>
        <input id="vNuevaDuracionSrv" type="number" placeholder="60" class="campo" required>
      </div>
    </div>`,
    async () => {
      const nombre = document.getElementById('vNuevoNombreSrv').value.trim();
      const precio = Number(document.getElementById('vNuevoPrecioSrv').value);
      const duracion = Number(document.getElementById('vNuevaDuracionSrv').value);

      if (!nombre || !precio) return false;

      const nuevoSrv = { id_servicio: serviciosGlobales.length + 1, nombre, precio, duracion_min: duracion || 45 };
      serviciosGlobales.push(nuevoSrv);

      try {
        if (typeof pedir === 'function') {
          await pedir('/servicios', 'POST', nuevoSrv);
        }
      } catch (e) {}

      notificarAdmin(`Servicio "${nombre}" añadido`);
      renderizarTablaServicios();
      return true;
    }
  );
};

window.modalEditarServicio = function(idServicio) {
  const srv = serviciosGlobales.find(s => (s.id_servicio || s.id) === idServicio);
  if (!srv) return;

  abrirModalAdmin(`Modificar Tarifa: ${srv.nombre}`,
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nuevo Precio ($ COP)</label>
        <input id="vEditPrecioSrv" type="number" value="${srv.precio}" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Nueva Duración (minutos)</label>
        <input id="vEditDuracionSrv" type="number" value="${srv.duracion_min || 45}" class="campo" required>
      </div>
    </div>`,
    async () => {
      srv.precio = Number(document.getElementById('vEditPrecioSrv').value);
      srv.duracion_min = Number(document.getElementById('vEditDuracionSrv').value);

      try {
        if (typeof pedir === 'function') {
          await pedir(`/servicios/${idServicio}`, 'PUT', { precio: srv.precio, duracion_min: srv.duracion_min });
        }
      } catch (e) {}

      notificarAdmin(`Servicio ${srv.nombre} actualizado`);
      renderizarTablaServicios();
      return true;
    }
  );
};

/* ==========================================================================
   5. NAVEGACIÓN ENTRE PESTAÑAS
   ========================================================================== */

window.switchTabAdmin = function(tab) {
  const secCitas = document.getElementById('secCitasAdmin');
  const secGanancias = document.getElementById('secGananciasAdmin');
  const secServicios = document.getElementById('secServiciosAdmin');

  const tabCitas = document.getElementById('tabCitas');
  const tabGanancias = document.getElementById('tabGanancias');
  const tabServicios = document.getElementById('tabServicios');

  if (secCitas) secCitas.classList.toggle('hidden', tab !== 'citas');
  if (secGanancias) secGanancias.classList.toggle('hidden', tab !== 'ganancias');
  if (secServicios) secServicios.classList.toggle('hidden', tab !== 'servicios');

  const estiloActivo = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-white text-black';
  const estiloInactivo = 'px-4 py-2 rounded-xl text-xs font-bold transition text-white/60 hover:text-white hover:bg-white/5';

  if (tabCitas) tabCitas.className = tab === 'citas' ? estiloActivo : estiloInactivo;
  if (tabGanancias) tabGanancias.className = tab === 'ganancias' ? estiloActivo : estiloInactivo;
  if (tabServicios) tabServicios.className = tab === 'servicios' ? estiloActivo : estiloInactivo;
};

/* ==========================================================================
   6. MODAL Y AUXILIARES
   ========================================================================== */

let alGuardarModal = null;

function abrirModalAdmin(titulo, html, alGuardar) {
  const tit = document.getElementById('tituloModalAdmin');
  const cont = document.getElementById('contenidoModalAdmin');
  if (tit) tit.textContent = titulo;
  if (cont) cont.innerHTML = html;

  alGuardarModal = alGuardar;

  const modal = document.getElementById('modalAdmin');
  if (modal && !modal.open) modal.showModal();
}

window.cerrarModalAdmin = function() {
  const modal = document.getElementById('modalAdmin');
  if (modal) modal.close();
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formModalAdmin');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!alGuardarModal) return;
      const ok = await alGuardarModal();
      if (ok) cerrarModalAdmin();
    });
  }
});

function formatearEstado(estado) {
  const estilos = {
    Pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Finalizada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const cls = estilos[estado] || 'bg-white/10 text-white/80 border-white/20';
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}">${estado}</span>`;
}

function notificarAdmin(mensaje) {
  const el = document.getElementById('avisoAdmin');
  if (!el) return;
  el.textContent = mensaje;
  el.classList.remove('opacity-0', '-translate-y-4');
  clearTimeout(el.timer);
  el.timer = setTimeout(() => el.classList.add('opacity-0', '-translate-y-4'), 3500);
}

function obtenerFechaHoy() {
  const hoy = new Date();
  return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapar(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.cerrarSesionAdmin = function() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.href = 'index.html';
};