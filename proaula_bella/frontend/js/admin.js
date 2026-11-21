

let usuarioAdmin = null;
let citasGlobales = [];
let serviciosGlobales = [];
let estilistasGlobales = [];
let productosGlobales = [];
let pagosGlobales = [];
let versionFotoAdmin = Date.now();
let alGuardarModalAdmin = null;

let conversacionAbierta = null;
let ultimoMensajeAdmin = 0;
const DIAS_SEMANA_ADMIN = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

verificarAccesoAdmin();

document.addEventListener('DOMContentLoaded', async () => {
  const fechaEl = document.getElementById('fechaHoyAdmin');
  if (fechaEl) {
    fechaEl.textContent = new Date().toLocaleDateString('es-CO', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  inicializarFotoPerfilAdmin();
  inicializarFormularioModalAdmin();
  prepararChatAdmin();

  await cargarDatosAdministrador();
  renderizarMetricasGanancias();
  renderizarTablaCitas();
  renderizarTablaPagos();
  renderizarTablaGanancias();
  renderizarTablaServicios();
  renderizarTablaProductos();
  renderizarTablaEquipo();
  poblarFiltroEstilistas();
  await cargarVitrinaSalon();
});

function obtenerIdAdmin() {
  return usuarioAdmin?.id ?? usuarioAdmin?.id_usuario ?? usuarioAdmin?.idUsuario;
}

function verificarAccesoAdmin() {
  if (typeof obtenerUsuarioActual === 'function') {
    usuarioAdmin = obtenerUsuarioActual();
  } else {
    try {
      usuarioAdmin = JSON.parse(localStorage.getItem('usuarioLogueado'));
    } catch (e) {
      usuarioAdmin = null;
    }
  }

  if (!usuarioAdmin) {
    window.location.replace('index.html');
    return;
  }

  const rolNorm = String(usuarioAdmin.rol || '').toLowerCase().trim();
  const esAdmin = rolNorm === 'admin' || rolNorm === 'administradora' || rolNorm.includes('admin');

  if (!esAdmin) {
    window.location.replace('panel.html?rol=' + encodeURIComponent(usuarioAdmin.rol || 'cliente'));
    return;
  }

  const nombreHeader = document.getElementById('nombreAdminHeader');
  if (nombreHeader) {
    nombreHeader.textContent = usuarioAdmin.nombre || usuarioAdmin.usuario || 'Administradora';
  }
}

// ---------------------------------------------------------------
// FOTO DE PERFIL ADMINISTRADORA (/api/usuarios/:id/foto)
// ---------------------------------------------------------------

function fotoDeUsuario(idUsuario) {
  return `/api/usuarios/${idUsuario}/foto?v=${versionFotoAdmin}`;
}

function mostrarFotoAdmin() {
  const idA = obtenerIdAdmin();
  const img = document.getElementById('fotoAdminHeader');
  if (img && idA) img.src = fotoDeUsuario(idA);
}

function inicializarFotoPerfilAdmin() {
  mostrarFotoAdmin();

  document.getElementById('btnCambiarFotoAdmin')?.addEventListener('click', () => {
    document.getElementById('archivoFotoAdmin')?.click();
  });

  document.getElementById('archivoFotoAdmin')?.addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;

    const idA = obtenerIdAdmin();
    if (!idA) return notificarAdmin('No se identificó el ID de la administradora');

    let imagen;
    try {
      imagen = await comprimirImagenAdmin(archivo, 500);
    } catch (err) {
      return notificarAdmin(err.message || 'No se pudo procesar la imagen');
    }

    const resp = await pedir(`/usuarios/${idA}/foto`, 'PUT', { imagen });
    notificarAdmin(resp.message || 'Foto actualizada');
    if (resp.success) {
      versionFotoAdmin = Date.now();
      mostrarFotoAdmin();
    }
  });

  document.getElementById('btnQuitarFotoAdmin')?.addEventListener('click', async () => {
    const idA = obtenerIdAdmin();
    if (!idA) return;
    const resp = await pedir(`/usuarios/${idA}/foto`, 'DELETE');
    notificarAdmin(resp.message || 'Foto eliminada');
    versionFotoAdmin = Date.now();
    mostrarFotoAdmin();
  });
}

function comprimirImagenAdmin(archivo, maxLado = 1200) {
  if (typeof reducirImagen === 'function') return reducirImagen(archivo, maxLado);
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('Imagen no válida'));
      img.src = lector.result;
    };
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

// ---------------------------------------------------------------
// CARGA REAL DESDE MYSQL
// ---------------------------------------------------------------

function normalizarCitaAdmin(c) {
  return {
    id: c.id_cita ?? c.id,
    id_clienta: c.id_clienta,
    id_servicio: c.id_servicio ?? c.idServicio,
    id_estilista: c.id_estilista ?? c.idEstilista,
    cliente: c.cliente || c.nombre_cliente || 'Clienta',
    servicio: c.servicio || c.nombre_servicio || 'Servicio',
    estilista: c.estilista || c.nombre_estilista || 'Por asignar',
    fecha: String(c.fecha || '').slice(0, 10),
    hora: String(c.hora || '').slice(0, 5),
    valor: Number(c.valor ?? c.precio ?? 0),
    precio: Number(c.precio ?? c.valor ?? 0),
    estado: c.estado || 'Pendiente',
    notas_servicio: c.notas_servicio || '',
    observaciones: c.observaciones || ''
  };
}

function normalizarEstilistaAdmin(e) {
  return {
    id: e.id_estilista ?? e.id,
    id_estilista: e.id_estilista ?? e.id,
    id_usuario: e.id_usuario,
    nombre: e.nombres ? `${e.nombres} ${e.apellidos || ''}`.trim() : (e.nombre || 'Estilista'),
    servicios: e.servicios || '',
    num_calificaciones: Number(e.num_calificaciones || 0),
    promedio: Number(e.promedio || 0)
  };
}

async function cargarDatosAdministrador() {
  citasGlobales = [];
  serviciosGlobales = [];
  estilistasGlobales = [];
  productosGlobales = [];
  pagosGlobales = [];

  try {
    const [resC, resS, resE, resP] = await Promise.all([
      pedir('/citas?rol=Administradora', 'GET').catch(() => null),
      pedir('/servicios', 'GET').catch(() => null),
      pedir('/estilistas', 'GET').catch(() => null),
      pedir('/productos', 'GET').catch(() => null)
    ]);

    const listaC = Array.isArray(resC) ? resC : (resC?.data || []);
    if (Array.isArray(listaC)) citasGlobales = listaC.map(normalizarCitaAdmin);

    const listaS = Array.isArray(resS) ? resS : (resS?.data || []);
    if (Array.isArray(listaS)) serviciosGlobales = listaS;

    const listaE = Array.isArray(resE) ? resE : (resE?.data || []);
    if (Array.isArray(listaE)) estilistasGlobales = listaE.map(normalizarEstilistaAdmin);

    const listaP = Array.isArray(resP) ? resP : (resP?.data || []);
    if (Array.isArray(listaP)) productosGlobales = listaP;

    if (typeof cargarPagosDesdeServidor === 'function') {
      pagosGlobales = await cargarPagosDesdeServidor('Administradora');
    }
  } catch (e) {
    console.error('Error cargando datos del panel administrador:', e);
  }
}

// ---------------------------------------------------------------
// MÉTRICAS Y TABLA DE CITAS
// ---------------------------------------------------------------

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
  const ico = (k) => typeof obtenerIcono === 'function' ? obtenerIcono(k, 'w-5 h-5') : '';

  contenedor.innerHTML = `
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-300 border border-pink-500/25 flex items-center justify-center">${ico('calendario')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Total Citas</span>
        <strong class="text-2xl font-serif text-white">${totalCitas} <span class="text-xs text-pink-400 font-sans font-normal">(${citasHoy} hoy)</span></strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center justify-center">${ico('dinero')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Ingresos Brutos</span>
        <strong class="text-2xl font-serif text-emerald-300">${fmt(ingresosBrutos)}</strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center justify-center">${ico('salon')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Ganancia Salón (40%)</span>
        <strong class="text-2xl font-serif text-amber-300">${fmt(gananciaSalon)}</strong>
      </div>
    </div>

    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center justify-center">${ico('corte')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Comisiones Estilistas (60%)</span>
        <strong class="text-2xl font-serif text-purple-300">${fmt(pagoEstilistas)}</strong>
      </div>
    </div>
  `;
}

function renderizarTablaCitas(lista = null) {
  const tabla = document.getElementById('tablaCitasAdmin');
  if (!tabla) return;

  const citas = lista || citasGlobales;
  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  if (citas.length === 0) {
    tabla.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-white/50">No hay citas registradas en el sistema.</td></tr>`;
    return;
  }

  tabla.innerHTML = citas.map(c => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">BS-${c.id}</td>
      <td class="p-3.5 font-bold text-white">
        ${escapar(c.cliente)}
        ${c.id_clienta ? `<button type="button" onclick="verHistorialClienta(${c.id_clienta})" class="ml-1.5 text-[10px] text-pink-400 hover:underline font-normal">Historial</button>` : ''}
      </td>
      <td class="p-3.5 text-white/80">${escapar(c.servicio)}</td>
      <td class="p-3.5 text-pink-300 font-semibold">${escapar(c.estilista)}</td>
      <td class="p-3.5 text-white/90 whitespace-nowrap">${escapar(c.fecha)} · ${escapar(c.hora)}</td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(c.valor || c.precio || 0)}</td>
      <td class="p-3.5">${formatearEstado(c.estado)}</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        ${c.estado === 'Pendiente' ? `<button type="button" onclick="actualizarEstado(${c.id}, 'Confirmada')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30">Confirmar</button>` : ''}
        ${c.estado === 'Confirmada' ? `<button type="button" onclick="actualizarEstado(${c.id}, 'Finalizada')" class="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold hover:bg-blue-500/30">Finalizar</button>` : ''}
        ${c.estado === 'Finalizada' ? `<a href="/api/citas/${c.id}/comprobante?token=${encodeURIComponent(localStorage.getItem('token') || '')}" target="_blank" rel="noopener" class="px-2 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-semibold hover:bg-sky-500/30">PDF</a>` : ''}
        ${c.estado === 'Finalizada' ? `<button type="button" onclick="editarNotasServicio(${c.id})" class="px-2 py-1 bg-white/10 text-white/80 rounded text-[11px] font-semibold hover:bg-white/20">Notas</button>` : ''}
        ${c.estado !== 'Cancelada' && c.estado !== 'Finalizada' ? `<button type="button" onclick="actualizarEstado(${c.id}, 'Cancelada')" class="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30">Cancelar</button>` : ''}
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
    const coincideEstilista = estil === 'todos' || String(c.id_estilista) === String(estil) || c.estilista === estil;
    const coincideTexto = !txt || c.cliente.toLowerCase().includes(txt) || c.servicio.toLowerCase().includes(txt);
    return coincideEstado && coincideEstilista && coincideTexto;
  });

  renderizarTablaCitas(res);
};

function poblarFiltroEstilistas() {
  const select = document.getElementById('filtroEstilista');
  if (!select) return;

  const opciones = estilistasGlobales.map(e => `<option value="${escapar(e.id)}">${escapar(e.nombre)}</option>`).join('');
  select.innerHTML = `<option value="todos">Todas las Estilistas</option>` + opciones;
}

window.actualizarEstado = async function(idCita, nuevoEstado) {
  const resp = await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: nuevoEstado });
  if (!resp || resp.errorRed || !resp.success) {
    notificarAdmin((resp && (resp.message || resp.mensaje)) || 'No se pudo actualizar el estado en el servidor');
    return;
  }

  const cita = citasGlobales.find(c => String(c.id) === String(idCita));
  if (cita) cita.estado = nuevoEstado;

  notificarAdmin(`Cita BS-${idCita} actualizada a ${nuevoEstado}`);
  renderizarMetricasGanancias();
  renderizarTablaCitas();
  renderizarTablaGanancias();
};

// ---------------------------------------------------------------
// PAGOS EN MYSQL (/api/pagos)
// ---------------------------------------------------------------

function renderizarTablaPagos() {
  const tabla = document.getElementById('tablaPagosAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + Number(num).toLocaleString('es-CO');

  if (pagosGlobales.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-white/50">No hay pagos registrados en MySQL todavía.</td></tr>`;
    return;
  }

  tabla.innerHTML = pagosGlobales.map(p => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-pink-300">${escapar(p.referencia)}</td>
      <td class="p-3.5 font-bold text-white">${escapar(p.cliente)}</td>
      <td class="p-3.5 text-white/80">${escapar(p.servicio)}</td>
      <td class="p-3.5 text-white/80">${escapar(p.metodo)}</td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(p.monto)}</td>
      <td class="p-3.5">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
          p.estado === 'Pagado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : p.estado === 'Rechazado' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }">${escapar(p.estado)}</span>
        ${p.comprobante ? `<span class="block mt-1 font-mono text-[10px] text-white/60">Comp. ${escapar(p.comprobante)}</span>` : ''}
      </td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        <button type="button" onclick="verComprobantePago(${p.id_cita})" class="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">Comprobante</button>
        ${p.estado === 'Pendiente en Salón' || p.estado === 'Por verificar' ? `<button type="button" onclick="confirmarCobroAdmin(${p.id_pago})" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold">${p.estado === 'Por verificar' ? 'Llegó: confirmar' : 'Confirmar Cobro'}</button>` : ''}
        ${p.estado === 'Por verificar' ? `<button type="button" onclick="rechazarPagoAdmin(${p.id_pago})" class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-semibold">No llegó</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// La transferencia Bre-B no aparece en la cuenta: se rechaza y la clienta puede pagar de nuevo
window.rechazarPagoAdmin = async function(idPago) {
  const resp = await pedir(`/pagos/${idPago}/estado`, 'PUT', { estado: 'Rechazado' });
  notificarAdmin((resp && resp.message) || 'No se pudo actualizar el pago');
  pagosGlobales = await cargarPagosDesdeServidor('Administradora');
  renderizarTablaPagos();
};

window.confirmarCobroAdmin = async function(idPago) {
  const resp = await pedir(`/pagos/${idPago}/estado`, 'PUT', { estado: 'Pagado' });
  if (!resp || !resp.success) {
    notificarAdmin((resp && resp.message) || 'No se pudo confirmar el cobro');
    return;
  }
  notificarAdmin('Cobro confirmado en MySQL');
  pagosGlobales = await cargarPagosDesdeServidor('Administradora');
  renderizarTablaPagos();
};

// ---------------------------------------------------------------
// BANDEJA DE MENSAJES DE BELLA (/conversaciones)
// ---------------------------------------------------------------

async function cargarConversaciones() {
  const lista = document.getElementById('listaConversacionesAdmin');
  const badge = document.getElementById('badgeSinLeerAdmin');
  if (!lista) return;

  const resp = await pedir('/conversaciones', 'GET').catch(() => null);
  const conversaciones = (resp && resp.data) || [];

  const totalSinLeer = conversaciones.reduce((acc, c) => acc + Number(c.sin_leer || 0), 0);
  if (badge) {
    badge.textContent = totalSinLeer;
    badge.classList.toggle('hidden', totalSinLeer === 0);
  }

  if (conversaciones.length === 0) {
    lista.innerHTML = `<li class="p-4 text-center text-xs text-white/50">No hay mensajes de visitantes todavía.</li>`;
    return;
  }

  lista.innerHTML = conversaciones.map((c) => {
    const idConv = c.id_conversacion ?? c.id;
    const activa = Number(idConv) === Number(conversacionAbierta);
    return `
      <li>
        <button type="button" data-conversacion="${idConv}"
          class="w-full text-left rounded-xl p-3 border transition ${
            activa
              ? 'border-pink-400 bg-pink-500/15'
              : 'border-white/10 bg-black/25 hover:bg-white/10'
          }">
          <span class="flex items-center justify-between gap-2">
            <span class="truncate font-bold text-xs text-white">${escapar(c.nombre)}</span>
            ${Number(c.sin_leer) > 0 ? `<span class="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">${c.sin_leer}</span>` : ''}
          </span>
          <span class="mt-1 block truncate text-[11px] text-white/65">${escapar(c.ultimo || 'Sin mensajes')}</span>
          <span class="mt-1 block text-[10px] font-semibold ${c.estado === 'Abierta' ? 'text-emerald-300' : 'text-white/40'}">${escapar(c.estado)}</span>
        </button>
      </li>
    `;
  }).join('');

  lista.querySelectorAll('button[data-conversacion]').forEach((boton) => {
    boton.addEventListener('click', () => abrirConversacion(Number(boton.dataset.conversacion)));
  });
}

async function abrirConversacion(id) {
  conversacionAbierta = id;
  ultimoMensajeAdmin = 0;

  document.getElementById('mensajesAdmin').innerHTML = '';
  const form = document.getElementById('formResponderAdmin');
  if (form) {
    form.classList.remove('hidden');
    form.classList.add('flex');
  }

  await cargarMensajesAdmin();
  await cargarConversaciones();
  document.getElementById('textoRespuestaAdmin')?.focus();
}

function dibujarMensajeAdmin(m) {
  const delSalon = m.autor !== 'Visitante';
  const quien = m.autor === 'Salon'
    ? 'Tú (Asesora)'
    : m.autor === 'Asistente'
      ? 'Bella (IA)'
      : 'Visitante';

  const estiloBurbuja = m.autor === 'Salon'
    ? 'bg-pink-500 text-white'
    : m.autor === 'Asistente'
      ? 'bg-purple-500/20 border border-purple-400/30 text-purple-100'
      : 'border border-white/10 bg-white/10 text-white/90';

  document.getElementById('mensajesAdmin').insertAdjacentHTML('beforeend', `
    <div class="max-w-[82%] ${delSalon ? 'ml-auto text-right' : ''}">
      <p class="mb-1 text-[10px] text-white/50">${quien} · ${escapar(m.hora)}</p>
      <p class="inline-block whitespace-pre-line rounded-2xl px-3.5 py-2 text-left text-xs ${estiloBurbuja}">${escapar(m.texto)}</p>
    </div>
  `);
}

async function cargarMensajesAdmin() {
  if (!conversacionAbierta) return;
  const resp = await pedir(`/conversaciones/${conversacionAbierta}/mensajes?desde=${ultimoMensajeAdmin}`, 'GET');
  if (!resp || !resp.success) return;

  const c = resp.data.conversacion;
  const nuevoEstado = c.estado === 'Abierta' ? 'Cerrada' : 'Abierta';
  const textoBoton = c.estado === 'Abierta' ? 'Cerrar conversación' : 'Reabrir';

  document.getElementById('cabeceraConversacion').innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-bold text-sm text-white">${escapar(c.nombre)}</p>
        <p class="text-[11px] text-white/60">${c.contacto ? escapar(c.contacto) : 'Sin teléfono ni correo'} · ${escapar(c.estado)}</p>
      </div>
      <button type="button" data-estado-conv="${nuevoEstado}" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold">${textoBoton}</button>
    </div>
  `;

  const caja = document.getElementById('mensajesAdmin');
  (resp.data.mensajes || []).filter((m) => m.id > ultimoMensajeAdmin).forEach((m) => {
    dibujarMensajeAdmin(m);
    ultimoMensajeAdmin = m.id;
  });

  if (resp.data.mensajes && resp.data.mensajes.length > 0) {
    caja.scrollTop = caja.scrollHeight;
  }
}

function prepararChatAdmin() {
  document.getElementById('formResponderAdmin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoTexto = document.getElementById('textoRespuestaAdmin');
    const texto = campoTexto.value.trim();
    if (!texto || !conversacionAbierta) return;

    const resp = await pedir(`/conversaciones/${conversacionAbierta}/responder`, 'POST', { texto });
    if (!resp.success) {
      notificarAdmin(resp.message || 'No se pudo enviar la respuesta');
      return;
    }

    campoTexto.value = '';
    await cargarMensajesAdmin();
    await cargarConversaciones();
  });

  document.getElementById('cabeceraConversacion')?.addEventListener('click', async (e) => {
    const boton = e.target.closest('button[data-estado-conv]');
    if (!boton || !conversacionAbierta) return;

    const resp = await pedir(`/conversaciones/${conversacionAbierta}/estado`, 'PUT', {
      estado: boton.dataset.estadoConv
    });
    notificarAdmin(resp.message || 'Estado actualizado');
    await cargarMensajesAdmin();
    await cargarConversaciones();
  });

  cargarConversaciones();
  setInterval(() => {
    cargarConversaciones();
    cargarMensajesAdmin();
  }, 5000);
}

// ---------------------------------------------------------------
// HISTORIAL DE CLIENTA Y NOTAS DEL SERVICIO
// ---------------------------------------------------------------

window.verHistorialClienta = async function(idClienta) {
  const resp = await pedir(`/clientas/${idClienta}/historial`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return notificarAdmin('No se pudo cargar el historial de la clienta.');

  const lista = datos.servicios.length === 0
    ? '<p class="text-xs text-white/60">Todavía no tiene servicios finalizados. Es su primera visita.</p>'
    : `<ol class="max-h-72 space-y-2.5 overflow-y-auto">${datos.servicios.map((s, i) => `
        <li class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs">
          <div class="flex justify-between gap-2">
            <strong class="text-white">${escapar(s.servicio)}</strong>
            <span class="text-white/50">${escapar(s.fecha)} · ${escapar(s.estilista)}</span>
          </div>
          ${i === 0 ? '<span class="text-[10px] font-bold text-pink-400">Última visita</span>' : ''}
          <p class="mt-1 text-white/80">${s.notas_servicio ? escapar(s.notas_servicio) : '<span class="text-white/40">Sin notas de la estilista</span>'}</p>
          <button type="button" data-notas-historial="${s.id}" class="mt-2 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold">Editar notas</button>
          ${s.calificacion ? `<p class="mt-1 text-amber-400">${'★'.repeat(Number(s.calificacion))}</p>` : ''}
        </li>
      `).join('')}</ol>`;

  abrirModalAdmin(`Historial de ${datos.clienta.nombre}`,
    `<p class="text-xs text-white/70">Profesión: <strong class="text-white">${escapar(datos.clienta.profesion || 'No registrada')}</strong></p>${lista}`,
    null
  );

  document.querySelectorAll('[data-notas-historial]').forEach(b => {
    b.addEventListener('click', () => {
      const servicio = datos.servicios.find(x => String(x.id) === b.dataset.notasHistorial);
      if (!servicio) return;
      abrirModalAdmin(`Notas · ${servicio.servicio} (${servicio.fecha})`,
        `<p class="text-xs text-white/70">Atendida por ${escapar(servicio.estilista)}.</p>
         <div>
           <label for="vNotasHist" class="text-xs text-white/70 block mb-1">Notas</label>
           <textarea id="vNotasHist" rows="4" maxlength="500" class="campo">${escapar(servicio.notas_servicio || '')}</textarea>
         </div>`,
        async () => {
          const notas = document.getElementById('vNotasHist').value.trim();
          const r = await pedir(`/citas/${servicio.id}/notas`, 'PUT', { notas });
          notificarAdmin(r.message || (r.success ? 'Notas actualizadas' : 'Error al guardar notas'));
          if (r.success) {
            await cargarDatosAdministrador();
            renderizarTablaCitas();
            setTimeout(() => verHistorialClienta(idClienta), 50);
            return true;
          }
          return false;
        }
      );
    });
  });
};

window.editarNotasServicio = function(idCita) {
  const c = citasGlobales.find(x => String(x.id) === String(idCita));
  abrirModalAdmin(`Notas del servicio · ${c ? c.cliente : ''}`,
    `<p class="text-xs text-white/70">Registra productos, tono o técnica aplicada para futuras visitas.</p>
     <div>
       <label for="vNotasAdmin" class="text-xs text-white/70 block mb-1">Notas</label>
       <textarea id="vNotasAdmin" rows="4" maxlength="500" class="campo" placeholder="Ej: Tinte 7.1 rubio ceniza, mascarilla de keratina.">${escapar(c?.notas_servicio || '')}</textarea>
     </div>`,
    async () => {
      const notas = document.getElementById('vNotasAdmin').value.trim();
      const resp = await pedir(`/citas/${idCita}/notas`, 'PUT', { notas });
      notificarAdmin(resp.message || (resp.success ? 'Notas guardadas' : 'Error al guardar notas'));
      if (resp.success) {
        if (c) c.notas_servicio = notas;
        return true;
      }
      return false;
    }
  );
};

// ---------------------------------------------------------------
// LIQUIDACIÓN Y COMISIONES (60/40)
// ---------------------------------------------------------------

function renderizarTablaGanancias() {
  const tabla = document.getElementById('tablaGananciasAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  if (estilistasGlobales.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-white/50">No hay estilistas registradas en el sistema.</td></tr>`;
    return;
  }

  const reporte = estilistasGlobales.map(est => {
    const citasAtendidas = citasGlobales.filter(c =>
      (String(c.id_estilista) === String(est.id_estilista) || c.estilista === est.nombre) && c.estado === 'Finalizada'
    );
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

// ---------------------------------------------------------------
// SERVICIOS Y FOTOS DE SERVICIOS (/servicios/:id/fotos)
// ---------------------------------------------------------------

function renderizarTablaServicios() {
  const tabla = document.getElementById('tablaServiciosAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');

  if (serviciosGlobales.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-white/50">No hay servicios registrados en MySQL.</td></tr>`;
    return;
  }

  tabla.innerHTML = serviciosGlobales.map(s => {
    const idSrv = s.id_servicio || s.id;
    return `
      <tr class="hover:bg-white/5 transition border-b border-white/5">
        <td class="p-3.5 font-mono text-white/50">#${idSrv}</td>
        <td class="p-3.5 font-bold text-white">${escapar(s.nombre)}</td>
        <td class="p-3.5 text-white/80">${s.duracion_min || 45} minutos · <span class="text-pink-300">${escapar(s.publico || 'Unisex')}</span></td>
        <td class="p-3.5 font-bold text-amber-300">${fmt(s.precio)}</td>
        <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
          <button type="button" onclick="fotosServicioAdmin(${idSrv})" class="px-3 py-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 text-xs font-semibold">Fotos</button>
          <button type="button" onclick="modalEditarServicio(${idSrv})" class="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">Editar Precio</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.fotosServicioAdmin = async function(idServicio) {
  const srv = serviciosGlobales.find(s => String(s.id_servicio || s.id) === String(idServicio));
  const resp = await pedir(`/servicios/${idServicio}/fotos`, 'GET');
  const fotos = (resp && resp.data) || [];

  const galeria = fotos.length === 0
    ? '<p class="text-xs text-white/60">Este servicio todavía no tiene fotos.</p>'
    : `<div class="grid grid-cols-3 gap-2">${fotos.map(f => `
        <div class="relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10">
          <img src="${escapar(f.url)}" alt="" class="h-full w-full object-cover">
          <button type="button" data-quitar-foto-srv="${f.id_foto}" class="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold">Quitar</button>
        </div>
      `).join('')}</div>`;

  abrirModalAdmin(`Fotos · ${srv ? srv.nombre : 'Servicio'}`,
    `${galeria}
     <div class="pt-3 border-t border-white/10">
       <label for="vFotosSrv" class="text-xs text-white/70 block mb-1">Agregar fotos (JPG, PNG o WEBP · máximo 6 por servicio)</label>
       <input id="vFotosSrv" type="file" accept="image/jpeg,image/png,image/webp" multiple class="campo">
       <p class="mt-1 text-[11px] text-white/50">Se suben apenas las escoges.</p>
     </div>`,
    null
  );

  document.getElementById('vFotosSrv')?.addEventListener('change', async (e) => {
    const archivos = [...e.target.files];
    for (const archivo of archivos) {
      const imagen = await comprimirImagenAdmin(archivo, 1200);
      await pedir(`/servicios/${idServicio}/fotos`, 'POST', { imagen });
    }
    notificarAdmin('Fotos del servicio actualizadas');
    fotosServicioAdmin(idServicio);
  });

  document.querySelectorAll('[data-quitar-foto-srv]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = await pedir(`/fotos/${btn.dataset.quitarFotoSrv}`, 'DELETE');
      notificarAdmin(r.message || 'Foto eliminada');
      fotosServicioAdmin(idServicio);
    });
  });
};

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
      <div>
        <label class="text-xs text-white/70 block mb-1">Para quién es</label>
        <select id="vNuevoPublicoSrv" class="campo"><option>Unisex</option><option>Mujer</option><option>Hombre</option></select>
      </div>
    </div>`,
    async () => {
      const nombre = document.getElementById('vNuevoNombreSrv').value.trim();
      const precio = Number(document.getElementById('vNuevoPrecioSrv').value);
      const duracion_min = Number(document.getElementById('vNuevaDuracionSrv').value) || 45;

      if (!nombre || !precio) return false;

      const publico = document.getElementById('vNuevoPublicoSrv').value;
      const resp = await pedir('/servicios', 'POST', { nombre, precio, duracion_min, publico });
      if (!resp || resp.errorRed || !resp.success) {
        notificarAdmin((resp && resp.message) || 'No se pudo crear el servicio en MySQL');
        return false;
      }

      notificarAdmin(`Servicio "${nombre}" añadido`);
      await cargarDatosAdministrador();
      renderizarTablaServicios();
      return true;
    }
  );
};

window.modalEditarServicio = function(idServicio) {
  const srv = serviciosGlobales.find(s => String(s.id_servicio || s.id) === String(idServicio));
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
      <div>
        <label class="text-xs text-white/70 block mb-1">Para quién es</label>
        <select id="vEditPublicoSrv" class="campo">${['Unisex', 'Mujer', 'Hombre'].map((o) => `<option ${o === (srv.publico || 'Unisex') ? 'selected' : ''}>${o}</option>`).join('')}</select>
      </div>
    </div>`,
    async () => {
      const precio = Number(document.getElementById('vEditPrecioSrv').value);
      const duracion_min = Number(document.getElementById('vEditDuracionSrv').value);

      const publico = document.getElementById('vEditPublicoSrv').value;
      const resp = await pedir(`/servicios/${idServicio}`, 'PUT', { nombre: srv.nombre, precio, duracion_min, publico });
      if (!resp || resp.errorRed || !resp.success) {
        notificarAdmin((resp && resp.message) || 'No se pudo actualizar el servicio en MySQL');
        return false;
      }

      srv.precio = precio;
      srv.duracion_min = duracion_min;
      srv.publico = publico;
      notificarAdmin(`Servicio ${srv.nombre} actualizado`);
      renderizarTablaServicios();
      return true;
    }
  );
};

// ---------------------------------------------------------------
// PRODUCTOS Y FOTOS DE PRODUCTOS (/productos/:id/foto)
// ---------------------------------------------------------------

function renderizarTablaProductos() {
  const tabla = document.getElementById('tablaProductosAdmin');
  if (!tabla) return;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + Number(num).toLocaleString('es-CO');

  if (productosGlobales.length === 0) {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-white/50">No hay productos registrados todavía.</td></tr>`;
    return;
  }

  tabla.innerHTML = productosGlobales.map(p => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-bold text-white">
        <div class="flex items-center gap-3">
          <img src="/api/productos/${p.id_producto}/foto?v=${versionFotoAdmin}" alt="" class="h-10 w-10 rounded-xl object-cover bg-white/5 border border-white/10">
          <span>${escapar(p.nombre)}</span>
        </div>
      </td>
      <td class="p-3.5 font-bold text-amber-300">${fmt(p.precio)}</td>
      <td class="p-3.5 text-white/80">${Number(p.stock || 0)} unidades</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        <button type="button" onclick="fotoProductoAdmin(${p.id_producto})" class="px-3 py-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 text-xs font-semibold">${Number(p.tiene_foto) ? 'Foto ✓' : 'Foto'}</button>
        <button type="button" onclick="modalEditarProducto(${p.id_producto})" class="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">Editar</button>
      </td>
    </tr>
  `).join('');
}

window.fotoProductoAdmin = function(idProducto) {
  const p = productosGlobales.find(x => String(x.id_producto) === String(idProducto));
  if (!p) return;

  abrirModalAdmin(`Foto · ${p.nombre}`,
    `<div class="flex items-center gap-4">
       <img src="/api/productos/${idProducto}/foto?v=${versionFotoAdmin}" alt="" class="h-24 w-24 rounded-2xl object-cover bg-white/5 border border-white/10">
       ${Number(p.tiene_foto)
         ? `<button type="button" id="btnQuitarFotoProd" class="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold">Quitar foto</button>`
         : '<p class="text-xs text-white/60">Sin foto asignada.</p>'}
     </div>
     <div class="pt-3 border-t border-white/10">
       <label for="vFotoProd" class="text-xs text-white/70 block mb-1">${Number(p.tiene_foto) ? 'Cambiar foto' : 'Subir foto'}</label>
       <input id="vFotoProd" type="file" accept="image/jpeg,image/png,image/webp" class="campo">
     </div>`,
    null
  );

  document.getElementById('vFotoProd')?.addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const imagen = await comprimirImagenAdmin(archivo, 1000);
    const r = await pedir(`/productos/${idProducto}/foto`, 'PUT', { imagen });
    versionFotoAdmin = Date.now();
    cerrarModalAdmin();
    notificarAdmin(r.message || 'Foto del producto actualizada');
    await cargarDatosAdministrador();
    renderizarTablaProductos();
  });

  document.getElementById('btnQuitarFotoProd')?.addEventListener('click', async () => {
    const r = await pedir(`/productos/${idProducto}/foto`, 'DELETE');
    versionFotoAdmin = Date.now();
    cerrarModalAdmin();
    notificarAdmin(r.message || 'Foto eliminada');
    await cargarDatosAdministrador();
    renderizarTablaProductos();
  });
};

window.modalCrearProducto = function() {
  abrirModalAdmin('Nuevo Producto',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombre del Producto</label>
        <input id="vProdNombre" type="text" placeholder="Ej: Shampoo Sin Sal 500ml" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Precio ($ COP)</label>
        <input id="vProdPrecio" type="number" placeholder="45000" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Stock inicial</label>
        <input id="vProdStock" type="number" value="10" min="0" class="campo" required>
      </div>
    </div>`,
    async () => {
      const nombre = document.getElementById('vProdNombre').value.trim();
      const precio = Number(document.getElementById('vProdPrecio').value);
      const stock = Number(document.getElementById('vProdStock').value);
      const r = await pedir('/productos', 'POST', { nombre, precio, stock });
      notificarAdmin(r.message || (r.success ? 'Producto creado' : 'Error al crear producto'));
      if (r.success) {
        await cargarDatosAdministrador();
        renderizarTablaProductos();
        return true;
      }
      return false;
    }
  );
};

window.modalEditarProducto = function(idProducto) {
  const p = productosGlobales.find(x => String(x.id_producto) === String(idProducto));
  if (!p) return;

  abrirModalAdmin(`Editar Producto: ${p.nombre}`,
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombre</label>
        <input id="vEditProdNombre" type="text" value="${escapar(p.nombre)}" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Precio ($ COP)</label>
        <input id="vEditProdPrecio" type="number" value="${p.precio}" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Stock disponible</label>
        <input id="vEditProdStock" type="number" value="${p.stock}" min="0" class="campo" required>
      </div>
    </div>`,
    async () => {
      const nombre = document.getElementById('vEditProdNombre').value.trim();
      const precio = Number(document.getElementById('vEditProdPrecio').value);
      const stock = Number(document.getElementById('vEditProdStock').value);
      const r = await pedir(`/productos/${idProducto}`, 'PUT', { nombre, precio, stock });
      notificarAdmin(r.message || (r.success ? 'Producto actualizado' : 'Error al actualizar'));
      if (r.success) {
        await cargarDatosAdministrador();
        renderizarTablaProductos();
        return true;
      }
      return false;
    }
  );
};

// ---------------------------------------------------------------
// EQUIPO, HORARIOS, AUSENCIAS Y CALIFICACIONES
// ---------------------------------------------------------------

function renderizarTablaEquipo() {
  const tabla = document.getElementById('tablaEquipoAdmin');
  if (!tabla) return;

  if (estilistasGlobales.length === 0) {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-white/50">No hay estilistas registradas.</td></tr>`;
    return;
  }

  tabla.innerHTML = estilistasGlobales.map(e => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-bold text-white">
        <div class="flex items-center gap-3">
          <img src="${fotoDeUsuario(e.id_usuario)}" alt="" class="h-9 w-9 rounded-xl object-cover bg-white/5 border border-white/10">
          <span>${escapar(e.nombre)}</span>
        </div>
      </td>
      <td class="p-3.5 text-white/70">${escapar(e.servicios || 'Sin servicios asignados')}</td>
      <td class="p-3.5 font-semibold ${e.num_calificaciones ? 'text-amber-300' : 'text-white/40'}">
        ${e.num_calificaciones ? `★ ${e.promedio.toFixed(1)} (${e.num_calificaciones})` : 'Sin calificaciones'}
      </td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        <button type="button" onclick="editarHorarioAdmin(${e.id_estilista}, '${escapar(e.nombre)}')" class="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">Horario</button>
        <button type="button" onclick="verAusenciasAdmin(${e.id_estilista}, '${escapar(e.nombre)}')" class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold">Ausencias</button>
        <button type="button" onclick="verOpinionesEstilistaAdmin(${e.id_estilista}, '${escapar(e.nombre)}')" class="px-2.5 py-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 text-xs font-semibold">Opiniones</button>
      </td>
    </tr>
  `).join('');
}

function opcionesHoraAdmin(valorSeleccionado, minMinutos, maxMinutos) {
  const selNorm = String(valorSeleccionado || '08:00').slice(0, 5);
  const opciones = [];
  for (let m = minMinutos; m <= maxMinutos; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const val = `${hh}:${mm}`;
    opciones.push(`<option value="${val}" ${val === selNorm ? 'selected' : ''}>${val}</option>`);
  }
  return opciones.join('');
}

window.editarHorarioAdmin = async function(idEstilista, nombre) {
  const resp = await pedir(`/estilistas/${idEstilista}/horario`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return notificarAdmin('No se pudo cargar el horario.');

  // Domingo al final; ese día el salón cierra a las 15:00
  const filas = [1, 2, 3, 4, 5, 6, 0].map((dia) => {
    const h = (datos.horario || []).find((x) => Number(x.dia_semana) === dia);
    const cierre = dia === 0 ? 15 * 60 : 19 * 60;
    return `
      <div class="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2">
        <label class="flex items-center gap-2 text-xs text-white">
          <input type="checkbox" name="vDiaAdmin" value="${dia}" class="accent-pink-500" ${h ? 'checked' : ''}>
          ${DIAS_SEMANA_ADMIN[dia]}
        </label>
        <select id="vIniAdmin${dia}" class="campo bg-[#120f1d] py-1.5 text-xs">${opcionesHoraAdmin(h ? h.hora_inicio : '08:00', 8 * 60, cierre - 60)}</select>
        <select id="vFinAdmin${dia}" class="campo bg-[#120f1d] py-1.5 text-xs">${opcionesHoraAdmin(h ? h.hora_fin : (dia === 0 ? '15:00' : '19:00'), 9 * 60, cierre)}</select>
      </div>
    `;
  }).join('');

  abrirModalAdmin(`Horario · ${nombre}`,
    `<div class="grid grid-cols-[6.5rem_1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-white/50"><span>Día</span><span>Entrada</span><span>Salida</span></div>
     <div class="space-y-2">${filas}</div>`,
    async () => {
      const dias = [...document.querySelectorAll('input[name="vDiaAdmin"]:checked')].map((c) => ({
        dia: Number(c.value),
        inicio: document.getElementById('vIniAdmin' + c.value).value,
        fin: document.getElementById('vFinAdmin' + c.value).value
      }));
      const r = await pedir(`/estilistas/${idEstilista}/horario`, 'PUT', { dias });
      notificarAdmin(r.message || 'Horario actualizado');
      return !!r.success;
    }
  );
};

window.verAusenciasAdmin = async function(idEstilista, nombre) {
  const resp = await pedir(`/estilistas/${idEstilista}/horario`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return notificarAdmin('No se pudieron cargar las ausencias.');

  const lista = (datos.ausencias || []).length === 0
    ? '<p class="text-xs text-white/60">No tiene ausencias registradas.</p>'
    : `<ul class="space-y-2 max-h-40 overflow-y-auto">${datos.ausencias.map((a) => `
        <li class="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs">
          <span>${escapar(String(a.fecha_inicio).slice(0, 10))} al ${escapar(String(a.fecha_fin).slice(0, 10))}${a.motivo ? ` · <span class="text-white/60">${escapar(a.motivo)}</span>` : ''}</span>
          <button type="button" data-quitar-aus-admin="${a.id_ausencia}" class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold">Quitar</button>
        </li>
      `).join('')}</ul>`;

  abrirModalAdmin(`Ausencias · ${nombre}`,
    `${lista}
     <p class="border-t border-white/10 pt-3 text-xs font-bold text-pink-300">Agregar ausencia</p>
     <div class="grid grid-cols-2 gap-3">
       <div>
         <label class="text-xs text-white/70 block mb-1">Desde</label>
         <input id="vAusDesdeAdmin" type="date" min="${obtenerFechaHoy()}" class="campo" required>
       </div>
       <div>
         <label class="text-xs text-white/70 block mb-1">Hasta</label>
         <input id="vAusHastaAdmin" type="date" min="${obtenerFechaHoy()}" class="campo" required>
       </div>
     </div>
     <div>
       <label class="text-xs text-white/70 block mb-1">Motivo (opcional)</label>
       <input id="vAusMotivoAdmin" type="text" maxlength="120" class="campo">
     </div>`,
    async () => {
      const desde = document.getElementById('vAusDesdeAdmin').value;
      const hasta = document.getElementById('vAusHastaAdmin').value;
      const motivo = document.getElementById('vAusMotivoAdmin').value.trim();
      const r = await pedir(`/estilistas/${idEstilista}/ausencias`, 'POST', { desde, hasta, motivo });
      notificarAdmin(r.message || 'Ausencia registrada');
      return !!r.success;
    }
  );

  document.querySelectorAll('[data-quitar-aus-admin]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const r = await pedir(`/ausencias/${boton.dataset.quitarAusAdmin}`, 'DELETE');
      notificarAdmin(r.message || 'Ausencia eliminada');
      verAusenciasAdmin(idEstilista, nombre);
    });
  });
};

window.verOpinionesEstilistaAdmin = async function(idEstilista, nombre) {
  const resp = await pedir(`/estilistas/${idEstilista}/calificaciones`, 'GET');
  const opiniones = (resp && resp.data) || [];

  const html = opiniones.length === 0
    ? '<p class="text-xs text-white/60">Todavía no tiene calificaciones.</p>'
    : `<div class="max-h-72 overflow-y-auto space-y-2.5">${opiniones.map(o => `
        <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div class="flex justify-between items-center text-xs">
            <strong class="text-white">${escapar(o.cliente || 'Clienta')}</strong>
            <span class="text-amber-400">${'★'.repeat(Number(o.estrellas || 5))}</span>
          </div>
          <p class="text-[11px] text-pink-300">${escapar(o.servicio || '')} · ${escapar(String(o.fecha || '').slice(0, 10))}</p>
          ${o.comentario ? `<p class="text-xs text-white/80">"${escapar(o.comentario)}"</p>` : ''}
        </div>
      `).join('')}</div>`;

  abrirModalAdmin(`Calificaciones · ${nombre}`, html, null);
};

// ---------------------------------------------------------------
// VITRINA DEL SALÓN (/vitrina?todas=1)
// ---------------------------------------------------------------

function verFotoGrandeAdmin(url, texto) {
  const visor = document.getElementById('visorFotoAdmin');
  if (!visor) return;
  document.getElementById('visorImagenAdmin').src = url;
  document.getElementById('visorTextoAdmin').textContent = texto || '';
  if (!visor.open) visor.showModal();
}

async function cargarVitrinaSalon() {
  const contenedor = document.getElementById('vitrinaSalon');
  if (!contenedor) return;

  const idA = obtenerIdAdmin();
  const resp = await pedir('/vitrina?todas=1', 'GET');
  const fotos = (resp && resp.data) || [];

  if (fotos.length === 0) {
    contenedor.innerHTML = `
      <div class="rounded-2xl border border-dashed border-white/15 p-8 text-center text-xs text-white/60">
        Todavía no hay fotos en la vitrina. Haz clic en <strong>+ Agregar foto</strong> para subir fotos del salón o promociones.
      </div>`;
    return;
  }

  contenedor.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">${fotos.map(f => {
    const autor = f.rol === 'Administradora' ? 'Salón' : (f.autor || '');
    const texto = [f.descripcion, autor].filter(Boolean).join(' · ');
    return `
      <figure class="group relative aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10">
        <button type="button" data-ver-admin="${escapar(f.url)}" data-texto-admin="${escapar(texto)}" class="h-full w-full">
          <img src="${escapar(f.url)}" alt="${escapar(f.descripcion || 'Vitrina')}" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
        </button>
        ${texto ? `<figcaption class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-[11px] text-white">${escapar(texto)}</figcaption>` : ''}
        <div class="absolute right-2 top-2 flex gap-1">
          <button type="button" data-editar-vitrina-admin="${f.id_foto}" data-desc-admin="${escapar(f.descripcion || '')}" class="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-semibold">Editar</button>
          <button type="button" data-quitar-vitrina-admin="${f.id_foto}" class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold">Quitar</button>
        </div>
      </figure>
    `;
  }).join('')}</div>`;

  contenedor.querySelectorAll('[data-ver-admin]').forEach(b => b.addEventListener('click', () => verFotoGrandeAdmin(b.dataset.verAdmin, b.dataset.textoAdmin)));
  contenedor.querySelectorAll('[data-quitar-vitrina-admin]').forEach(b => b.addEventListener('click', async () => {
    const r = await pedir(`/vitrina/${b.dataset.quitarVitrinaAdmin}?idUsuario=${idA}`, 'DELETE');
    notificarAdmin(r.message || 'Foto eliminada');
    await cargarVitrinaSalon();
  }));
  contenedor.querySelectorAll('[data-editar-vitrina-admin]').forEach(b => b.addEventListener('click', () => {
    abrirModalAdmin('Editar descripción',
      `<div>
        <label for="vDescVitrinaAdmin" class="text-xs text-white/70 block mb-1">Descripción</label>
        <input id="vDescVitrinaAdmin" type="text" maxlength="120" value="${escapar(b.dataset.descAdmin)}" class="campo">
      </div>`,
      async () => {
        const desc = document.getElementById('vDescVitrinaAdmin').value.trim();
        const r = await pedir(`/vitrina/${b.dataset.editarVitrinaAdmin}`, 'PUT', { idUsuario: idA, descripcion: desc });
        notificarAdmin(r.message || 'Descripción actualizada');
        if (r.success) {
          await cargarVitrinaSalon();
          return true;
        }
        return false;
      }
    );
  }));
}

window.agregarAVitrinaSalon = function() {
  const idA = obtenerIdAdmin();
  abrirModalAdmin('Agregar a la Vitrina del Salón',
    `<div>
      <label for="vDescNuevaSalon" class="text-xs text-white/70 block mb-1">Descripción (opcional, escríbela antes de escoger fotos)</label>
      <input id="vDescNuevaSalon" type="text" maxlength="120" placeholder="Ej: Nuevo espacio de manicure · Promoción del mes" class="campo">
    </div>
    <div>
      <label for="vArchivosSalon" class="text-xs text-white/70 block mb-1">Fotos (JPG, PNG o WEBP)</label>
      <input id="vArchivosSalon" type="file" accept="image/jpeg,image/png,image/webp" multiple class="campo">
      <p class="mt-1.5 text-[11px] text-white/50">Se suben automáticamente apenas las seleccionas.</p>
    </div>`,
    null
  );

  document.getElementById('vArchivosSalon')?.addEventListener('change', async (e) => {
    const archivos = [...e.target.files];
    if (!archivos.length) return;
    const descripcion = document.getElementById('vDescNuevaSalon')?.value.trim() || '';

    let subidas = 0;
    for (const archivo of archivos) {
      notificarAdmin(`Subiendo ${subidas + 1} de ${archivos.length}...`);
      const imagen = await comprimirImagenAdmin(archivo, 1200);
      const r = await pedir('/vitrina', 'POST', { idUsuario: idA, imagen, descripcion });
      if (!r.success) {
        notificarAdmin(r.message || 'Error al subir foto');
        break;
      }
      subidas++;
    }

    cerrarModalAdmin();
    if (subidas > 0) notificarAdmin(subidas === 1 ? 'Foto agregada a la vitrina' : `${subidas} fotos agregadas`);
    await cargarVitrinaSalon();
  });
};

// ---------------------------------------------------------------
// NAVEGACIÓN DE PESTAÑAS, MODAL Y UTILIDADES
// ---------------------------------------------------------------

window.switchTabAdmin = function(tab) {
  const secciones = {
    citas: 'secCitasAdmin',
    pagos: 'secPagosAdmin',
    pedidos: 'secPedidosAdmin',
    mensajes: 'secMensajesAdmin',
    ganancias: 'secGananciasAdmin',
    servicios: 'secServiciosAdmin',
    productos: 'secProductosAdmin',
    equipo: 'secEquipoAdmin',
    vitrina: 'secVitrinaAdmin'
  };

  const botones = {
    citas: 'tabCitas',
    pagos: 'tabPagos',
    pedidos: 'tabPedidos',
    mensajes: 'tabMensajes',
    ganancias: 'tabGanancias',
    servicios: 'tabServicios',
    productos: 'tabProductos',
    equipo: 'tabEquipo',
    vitrina: 'tabVitrina'
  };

  Object.keys(secciones).forEach(k => {
    const sec = document.getElementById(secciones[k]);
    const btn = document.getElementById(botones[k]);
    const activo = k === tab;

    if (sec) sec.classList.toggle('hidden', !activo);
    if (activo && k === 'pedidos' && window.cargarPedidosAdmin) window.cargarPedidosAdmin();
    if (btn) {
      const esMensajes = k === 'mensajes';
      btn.className = activo
        ? `px-4 py-2 rounded-xl text-xs font-bold transition bg-white text-black ${esMensajes ? 'inline-flex items-center gap-1.5' : ''}`
        : `px-4 py-2 rounded-xl text-xs font-bold transition text-white/60 hover:text-white hover:bg-white/5 ${esMensajes ? 'inline-flex items-center gap-1.5' : ''}`;
    }
  });
};

function abrirModalAdmin(titulo, html, alGuardar) {
  const tit = document.getElementById('tituloModalAdmin');
  const cont = document.getElementById('contenidoModalAdmin');
  const btnGuardar = document.getElementById('btnGuardarModalAdmin');

  if (tit) tit.textContent = titulo;
  if (cont) cont.innerHTML = html;
  alGuardarModalAdmin = alGuardar;

  if (btnGuardar) {
    btnGuardar.style.display = alGuardar ? 'inline-flex' : 'none';
  }

  const modal = document.getElementById('modalAdmin');
  if (modal && !modal.open) modal.showModal();
}

window.cerrarModalAdmin = function() {
  const modal = document.getElementById('modalAdmin');
  if (modal) modal.close();
};

function inicializarFormularioModalAdmin() {
  const form = document.getElementById('formModalAdmin');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!alGuardarModalAdmin) {
      cerrarModalAdmin();
      return;
    }
    const ok = await alGuardarModalAdmin();
    if (ok) cerrarModalAdmin();
  });
}

function formatearEstado(estado) {
  const estilos = {
    Pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Finalizada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const cls = estilos[estado] || 'bg-white/10 text-white/80 border-white/20';
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}">${escapar(estado)}</span>`;
}

function notificarAdmin(msj) {
  const av = document.getElementById('avisoAdmin');
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

window.cerrarSesionAdmin = function() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.replace('welcome.html');
};