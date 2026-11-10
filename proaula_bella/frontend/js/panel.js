// js/panel.js - Gestor Administrador de Citas, Ganancias y Servicios

let todasLasCitas = [];
let listaEstilistas = [];
let listaServicios = [];

document.addEventListener('DOMContentLoaded', async () => {
  verificarSesionAdmin();
  document.getElementById('fechaHoyReporte').textContent = new Date().toLocaleDateString('es-CO', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  await cargarDatosIniciales();
  renderizarMetricasAdmin();
  renderizarTablaCitasAdmin();
  renderizarTablaGananciasAdmin();
  renderizarTablaServiciosAdmin();
  poblarFiltroEstilistas();
});

function verificarSesionAdmin() {
  const usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  const nomEl = document.getElementById('nombreUsuarioPanel');

  if (usuario) {
    if (nomEl) nomEl.textContent = usuario.nombre || usuario.usuario;
  } else {
    window.location.href = 'index.html';
  }
}

async function cargarDatosIniciales() {
  // Citas de demostración integradas con fallback seguro
  todasLasCitas = [
    { id: 101, cliente: 'Ana María López', servicio: 'Mechas / Balayage', id_servicio: 3, estilista: 'Diana Carmen', id_estilista: 1, fecha: fechaDeHoy(), hora: '10:00 AM', valor: 180000, estado: 'Finalizada' },
    { id: 102, cliente: 'Martina Flórez', servicio: 'Manicure', id_servicio: 5, estilista: 'Sofía Martínez', id_estilista: 2, fecha: fechaDeHoy(), hora: '11:30 AM', valor: 45000, estado: 'Confirmada' },
    { id: 103, cliente: 'Laura Gómez', servicio: 'Corte de Cabello', id_servicio: 1, estilista: 'Diana Carmen', id_estilista: 1, fecha: fechaDeHoy(), hora: '02:00 PM', valor: 35000, estado: 'Pendiente' },
    { id: 104, cliente: 'Carolina Ruiz', servicio: 'Tinte / Coloración', id_servicio: 2, estilista: 'Diana Carmen', id_estilista: 1, fecha: fechaDeHoy(), hora: '04:00 PM', valor: 90000, estado: 'Finalizada' }
  ];

  listaServicios = [
    { id_servicio: 1, nombre: 'Corte de Cabello', precio: 35000, duracion_min: 45 },
    { id_servicio: 2, nombre: 'Tinte / Coloración', precio: 90000, duracion_min: 90 },
    { id_servicio: 3, nombre: 'Mechas / Balayage', precio: 180000, duracion_min: 180 },
    { id_servicio: 4, nombre: 'Peinado para Evento', precio: 70000, duracion_min: 60 },
    { id_servicio: 5, nombre: 'Manicure', precio: 45000, duracion_min: 60 },
    { id_servicio: 6, nombre: 'Pedicure', precio: 40000, duracion_min: 50 },
    { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 150000, duracion_min: 120 }
  ];

  listaEstilistas = [
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

      if (resC && resC.success && Array.isArray(resC.data) && resC.data.length > 0) todasLasCitas = resC.data;
      if (resS && resS.success && Array.isArray(resS.data) && resS.data.length > 0) listaServicios = resS.data;
      if (resE && resE.success && Array.isArray(resE.data) && resE.data.length > 0) listaEstilistas = resE.data;
    }
  } catch (e) {}
}

/* ==========================================================================
   1. MÉTRICAS GENERALES Y GANANCIAS
   ========================================================================== */

function renderizarMetricasAdmin() {
  const contenedor = document.getElementById('metricasAdmin');
  if (!contenedor) return;

  const totalCitas = todasLasCitas.length;
  const citasHoy = todasLasCitas.filter(c => c.fecha === fechaDeHoy()).length;
  
  // Ingresos calculados solo sobre citas Finalizadas
  const ingresosBrutos = todasLasCitas
    .filter(c => c.estado === 'Finalizada')
    .reduce((acc, c) => acc + (Number(c.valor) || Number(c.precio) || 0), 0);

  const gananciaSalon = ingresosBrutos * 0.40; // 40% comisión salón
  const comisionEstilistas = ingresosBrutos * 0.60; // 60% comisión estilistas

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  contenedor.innerHTML = `
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-bold text-xl">📅</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Citas Registradas</span>
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
        <span class="text-xs uppercase text-white/50 font-semibold block">Pago Estilistas (60%)</span>
        <strong class="text-2xl font-serif text-purple-300">${fmt(comisionEstilistas)}</strong>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2. CONTROL Y FILTRADO DE CITAS
   ========================================================================== */

function renderizarTablaCitasAdmin(citasFiltradas = null) {
  const tabla = document.getElementById('tablaCitasAdmin');
  if (!tabla) return;

  const lista = citasFiltradas || todasLasCitas;
  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  if (lista.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-white/50">No hay citas registradas con los filtros seleccionados.</td></tr>`;
    return;
  }

  tabla.innerHTML = lista.map(c => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">BS-${c.id}</td>
      <td class="p-3.5 font-bold text-white">${escapar(c.cliente)}</td>
      <td class="p-3.5 text-white/80">${escapar(c.servicio)}</td>
      <td class="p-3.5 text-pink-300 font-semibold">${escapar(c.estilista)}</td>
      <td class="p-3.5 text-white/90 whitespace-nowrap">${c.fecha} · ${c.hora}</td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(c.valor || c.precio || 0)}</td>
      <td class="p-3.5">${etiquetaEstadoAdmin(c.estado)}</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        ${c.estado === 'Pendiente' ? `<button onclick="cambiarEstadoCita(${c.id}, 'Confirmada')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30">Confirmar</button>` : ''}
        ${c.estado === 'Confirmada' ? `<button onclick="cambiarEstadoCita(${c.id}, 'Finalizada')" class="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold hover:bg-blue-500/30">Finalizar</button>` : ''}
        ${c.estado !== 'Cancelada' && c.estado !== 'Finalizada' ? `<button onclick="cambiarEstadoCita(${c.id}, 'Cancelada')" class="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30">Cancelar</button>` : ''}
        <button onclick="modalReasignarEstilista(${c.id})" class="px-2 py-1 bg-white/10 text-white hover:bg-white/20 rounded text-[11px] font-semibold">Reasignar</button>
      </td>
    </tr>
  `).join('');
}

window.filtrarCitasAdmin = function() {
  const est = document.getElementById('filtroEstadoAdmin')?.value || 'todos';
  const estil = document.getElementById('filtroEstilistaAdmin')?.value || 'todos';
  const txt = document.getElementById('filtroTextoAdmin')?.value.toLowerCase().trim() || '';

  const res = todasLasCitas.filter(c => {
    const coincideEstado = est === 'todos' || c.estado === est;
    const coincideEstilista = estil === 'todos' || String(c.id_estilista || c.estilista) === estil;
    const coincideTexto = !txt || c.cliente.toLowerCase().includes(txt) || c.servicio.toLowerCase().includes(txt);
    return coincideEstado && coincideEstilista && coincideTexto;
  });

  renderizarTablaCitasAdmin(res);
};

function poblarFiltroEstilistas() {
  const select = document.getElementById('filtroEstilistaAdmin');
  if (!select) return;

  const opciones = listaEstilistas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  select.innerHTML = `<option value="todos">Todas las Estilistas</option>` + opciones;
}

window.cambiarEstadoCita = async function(idCita, nuevoEstado) {
  const cita = todasLasCitas.find(c => c.id === idCita);
  if (cita) cita.estado = nuevoEstado;

  try {
    if (typeof pedir === 'function') {
      await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: nuevoEstado });
    }
  } catch (e) {}

  avisar(`Cita BS-${idCita} marcada como ${nuevoEstado}`);
  renderizarMetricasAdmin();
  renderizarTablaCitasAdmin();
  renderizarTablaGananciasAdmin();
};

window.modalReasignarEstilista = function(idCita) {
  const cita = todasLasCitas.find(c => c.id === idCita);
  if (!cita) return;

  const opciones = listaEstilistas.map(e => `<option value="${e.id}" ${e.nombre === cita.estilista ? 'selected' : ''}>${e.nombre}</option>`).join('');

  abrirVentana(`Reasignar Cita BS-${idCita}`,
    `<div>
      <label class="text-xs text-white/70 block mb-1">Selecciona nueva estilista para ${cita.cliente}:</label>
      <select id="vNuevoEstilista" class="campo bg-[#120f1d]">${opciones}</select>
    </div>`,
    async () => {
      const selectEl = document.getElementById('vNuevoEstilista');
      const nombreNuevo = selectEl.options[selectEl.selectedIndex].text;
      cita.estilista = nombreNuevo;
      cita.id_estilista = Number(selectEl.value);

      avisar(`Estilista de cita BS-${idCita} cambiada a ${nombreNuevo}`);
      renderizarTablaCitasAdmin();
      return { success: true };
    }
  );
};

/* ==========================================================================
   3. RENDIMIENTO Y PAGO A ESTILISTAS
   ========================================================================== */

function renderizarTablaGananciasAdmin() {
  const tabla = document.getElementById('tablaGananciasEstilistas');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  const reporte = listaEstilistas.map(est => {
    const citasAtendidas = todasLasCitas.filter(c => (c.id_estilista === est.id || c.estilista === est.nombre) && c.estado === 'Finalizada');
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
   4. GESTIÓN DE CATÁLOGO Y PRECIOS DE SERVICIOS
   ========================================================================== */

function renderizarTablaServiciosAdmin() {
  const tabla = document.getElementById('tablaGestionServicios');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  tabla.innerHTML = listaServicios.map(s => `
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

window.modalNuevoServicio = function() {
  abrirVentana('Agregar Nuevo Servicio',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombre del Servicio</label>
        <input id="vNuevoNombreSrv" type="text" placeholder="Ej: Keratina Orgánica" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Precio ($ COP)</label>
        <input id="vNuevoPrecioSrv" type="number" placeholder="120000" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Duración estimada (minutos)</label>
        <input id="vNuevaDuracionSrv" type="number" placeholder="60" class="campo" required>
      </div>
    </div>`,
    async () => {
      const nombre = document.getElementById('vNuevoNombreSrv').value.trim();
      const precio = Number(document.getElementById('vNuevoPrecioSrv').value);
      const duracion = Number(document.getElementById('vNuevaDuracionSrv').value);

      if (!nombre || !precio) return { success: false, message: 'Ingresa nombre y precio.' };

      const nuevoSrv = { id_servicio: listaServicios.length + 1, nombre, precio, duracion_min: duracion || 45 };
      listaServicios.push(nuevoSrv);

      try {
        if (typeof pedir === 'function') {
          await pedir('/servicios', 'POST', nuevoSrv);
        }
      } catch (e) {}

      avisar(`Servicio "${nombre}" agregado al catálogo`);
      renderizarTablaServiciosAdmin();
      return { success: true };
    }
  );
};

window.modalEditarServicio = function(idServicio) {
  const srv = listaServicios.find(s => (s.id_servicio || s.id) === idServicio);
  if (!srv) return;

  abrirVentana(`Editar Servicio: ${srv.nombre}`,
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Precio Público ($ COP)</label>
        <input id="vEditPrecioSrv" type="number" value="${srv.precio}" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Duración (minutos)</label>
        <input id="vEditDuracionSrv" type="number" value="${srv.duracion_min || 45}" class="campo" required>
      </div>
    </div>`,
    async () => {
      const nuevoPrecio = Number(document.getElementById('vEditPrecioSrv').value);
      const nuevaDuracion = Number(document.getElementById('vEditDuracionSrv').value);

      srv.precio = nuevoPrecio;
      srv.duracion_min = nuevaDuracion;

      try {
        if (typeof pedir === 'function') {
          await pedir(`/servicios/${idServicio}`, 'PUT', { precio: nuevoPrecio, duracion_min: nuevaDuracion });
        }
      } catch (e) {}

      avisar(`Servicio ${srv.nombre} actualizado`);
      renderizarTablaServiciosAdmin();
      return { success: true };
    }
  );
};

/* ==========================================================================
   5. NAVEGACIÓN ENTRE PESTAÑAS ADMINISTRATIVAS
   ========================================================================== */

window.cambiarPestanaAdmin = function(pestana) {
  const secCitas = document.getElementById('secCitasAdmin');
  const secGanancias = document.getElementById('secGananciasAdmin');
  const secServicios = document.getElementById('secServiciosAdmin');

  const tabCitas = document.getElementById('tabCitas');
  const tabGanancias = document.getElementById('tabGanancias');
  const tabServicios = document.getElementById('tabServicios');

  if (secCitas) secCitas.classList.toggle('hidden', pestana !== 'citas');
  if (secGanancias) secGanancias.classList.toggle('hidden', pestana !== 'ganancias');
  if (secServicios) secServicios.classList.toggle('hidden', pestana !== 'servicios');

  const estiloActivo = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-white text-black';
  const estiloInactivo = 'px-4 py-2 rounded-xl text-xs font-bold transition text-white/60 hover:text-white hover:bg-white/5';

  if (tabCitas) tabCitas.className = pestana === 'citas' ? estiloActivo : estiloInactivo;
  if (tabGanancias) tabGanancias.className = pestana === 'ganancias' ? estiloActivo : estiloInactivo;
  if (tabServicios) tabServicios.className = pestana === 'servicios' ? estiloActivo : estiloInactivo;
};

/* ==========================================================================
   6. UTILIDADES VENTANA Y AUXILIARES
   ========================================================================== */

let alGuardarVentana = null;

function abrirVentana(titulo, camposHtml, alGuardar) {
  const tit = document.getElementById('tituloVentana');
  const camp = document.getElementById('camposVentana');
  if (tit) tit.textContent = titulo;
  if (camp) camp.innerHTML = camposHtml;

  const alerta = document.getElementById('alertaVentana');
  if (alerta) alerta.style.display = 'none';

  alGuardarVentana = alGuardar;

  const ventana = document.getElementById('ventana');
  if (ventana && !ventana.open) ventana.showModal();
}

window.cerrarVentana = function() {
  const ventana = document.getElementById('ventana');
  if (ventana) ventana.close();
};

document.addEventListener('DOMContentLoaded', () => {
  const formVentana = document.getElementById('formVentana');
  if (formVentana) {
    formVentana.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!alGuardarVentana) return;
      const resp = await alGuardarVentana();
      if (resp && (resp.success || resp.ok)) {
        cerrarVentana();
      }
    });
  }
});

function etiquetaEstadoAdmin(estado) {
  const estilos = {
    Pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Finalizada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const cls = estilos[estado] || 'bg-white/10 text-white/80 border-white/20';
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}">${estado}</span>`;
}

function avisar(mensaje) {
  const aviso = document.getElementById('aviso');
  if (!aviso) return;
  aviso.textContent = mensaje;
  aviso.classList.remove('opacity-0', '-translate-y-4');
  clearTimeout(aviso.temporizador);
  aviso.temporizador = setTimeout(() => aviso.classList.add('opacity-0', '-translate-y-4'), 3500);
}

function fechaDeHoy() {
  const hoy = new Date();
  return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapar(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.cerrarSesionPanel = function() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.href = 'index.html';
};