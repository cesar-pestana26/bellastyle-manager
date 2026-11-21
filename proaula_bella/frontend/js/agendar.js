// js/agendar.js - Agendamiento conectado a MySQL (POST /api/citas y GET /disponibilidad)

let servicioSeleccionado = null;
let estilistaSeleccionada = { id: 0, nombre: 'Cualquiera Disponible' };
let horaSeleccionada = null;

let todosLosServicios = [];
let filtroPublico = 'Todos';
let filtroCategoria = 'Todas';
let textoBusqueda = '';

document.addEventListener('DOMContentLoaded', async () => {
  verificarSesionUsuario();
  establecerFechaMinima();
  await cargarServicios();
  await cargarEstilistas();
  await actualizarDisponibilidadHorarios();
  procesarParametrosURL();
});

function convertirHoraA24(horaStr) {
  const txt = String(horaStr || '').trim().toUpperCase();
  const match = txt.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (!match) return txt.slice(0, 5);
  let horas = parseInt(match[1], 10);
  const minutos = match[2];
  const periodo = match[3];
  if (periodo === 'PM' && horas < 12) horas += 12;
  if (periodo === 'AM' && horas === 12) horas = 0;
  return `${String(horas).padStart(2, '0')}:${minutos}`;
}

function obtenerUsuarioLogueado() {
  let usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  if (!usuario) {
    try {
      usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    } catch (e) {}
  }
  return usuario;
}

function verificarSesionUsuario() {
  const usuario = obtenerUsuarioLogueado();
  const label = document.getElementById('labelUsuario');
  const btnHeader = document.getElementById('btnAccesoHeader');

  if (usuario) {
    if (label) {
      label.textContent = `Hola, ${usuario.nombre || usuario.usuario}`;
      label.classList.remove('hidden');
    }
    if (btnHeader) {
      const esAdmin = String(usuario.rol || '').toLowerCase().includes('admin');
      btnHeader.textContent = 'Mi Panel';
      btnHeader.href = esAdmin ? 'admin.html' : 'panel.html';
    }
  }
}

function establecerFechaMinima() {
  const inputFecha = document.getElementById('fechaCita');
  if (!inputFecha) return;
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  inputFecha.min = hoyLocal;
  inputFecha.value = hoyLocal;
  inputFecha.addEventListener('change', async () => {
    horaSeleccionada = null;
    actualizarResumen();
    await actualizarDisponibilidadHorarios();
  });
}

function obtenerClaveIconoCategoria(categoria) {
  const c = String(categoria || '').toLowerCase();
  if (c.includes('corte')) return 'corte';
  if (c.includes('manicure')) return 'manicure';
  if (c.includes('mechas') || c.includes('balayage')) return 'mechas';
  if (c.includes('pedicure')) return 'pedicure';
  if (c.includes('peinado')) return 'peinado';
  if (c.includes('tinte') || c.includes('color')) return 'tinte';
  return 'tratamiento';
}

async function cargarServicios() {
  const contenedor = document.getElementById('contenedorServiciosAgendar');
  if (!contenedor) return;

  todosLosServicios = [];

  try {
    let resp = null;
    if (typeof pedir === 'function') {
      resp = await pedir('/servicios', 'GET');
    } else {
      const r = await fetch('/api/servicios');
      resp = await r.json();
    }

    const lista = Array.isArray(resp) ? resp : (resp?.data || resp?.servicios || []);
    if (Array.isArray(lista) && lista.length > 0) {
      todosLosServicios = lista.map(srv => ({
        id: Number(srv.id_servicio || srv.id),
        categoria: srv.categoria || srv.nombre || 'General',
        nombre: srv.nombre,
        publico: srv.publico || 'Unisex',
        precio: Number(srv.precio) || 0,
        duracion_min: Number(srv.duracion_min || srv.duracion) || 45,
        icono: obtenerClaveIconoCategoria(srv.categoria || srv.nombre)
      }));
    }
  } catch (e) {
    console.error('Error al cargar servicios:', e);
  }

  inyectarControlesFiltroServicios(contenedor);
  renderizarTarjetasServicios();
}

function inyectarControlesFiltroServicios(contenedor) {
  if (document.getElementById('controlesFiltroServiciosAgendar')) return;

  const categoriasUnicas = ['Todas', ...new Set(todosLosServicios.map(s => s.categoria))];

  const htmlFiltros = `
    <div id="controlesFiltroServiciosAgendar" class="mb-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="text-white/50 font-semibold mr-1">Público:</span>
          <button type="button" data-pub="Todos" class="btn-filtro-pub px-3 py-1 rounded-full bg-white text-black font-bold transition">Todos</button>
          <button type="button" data-pub="Mujer" class="btn-filtro-pub px-3 py-1 rounded-full bg-white/5 text-white/70 hover:text-white border border-white/10 font-semibold transition">Mujer</button>
          <button type="button" data-pub="Hombre" class="btn-filtro-pub px-3 py-1 rounded-full bg-white/5 text-white/70 hover:text-white border border-white/10 font-semibold transition">Hombre</button>
          <button type="button" data-pub="Unisex" class="btn-filtro-pub px-3 py-1 rounded-full bg-white/5 text-white/70 hover:text-white border border-white/10 font-semibold transition">Unisex</button>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <select id="selectCategoriaAgendar" class="campo bg-[#120f1d] py-1.5 px-3 text-xs">
            ${categoriasUnicas.map(cat => `<option value="${escapar(cat)}">${cat === 'Todas' ? 'Todas las categorías' : escapar(cat)}</option>`).join('')}
          </select>
          <input id="inputBuscarServicioAgendar" type="text" placeholder="Buscar corte, manicure, tinte..." class="campo py-1.5 px-3 text-xs sm:w-52">
        </div>
      </div>
    </div>
  `;

  contenedor.insertAdjacentHTML('beforebegin', htmlFiltros);

  document.querySelectorAll('.btn-filtro-pub').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroPublico = btn.dataset.pub;
      document.querySelectorAll('.btn-filtro-pub').forEach(b => {
        const activo = b.dataset.pub === filtroPublico;
        b.className = activo
          ? 'btn-filtro-pub px-3 py-1 rounded-full bg-white text-black font-bold transition'
          : 'btn-filtro-pub px-3 py-1 rounded-full bg-white/5 text-white/70 hover:text-white border border-white/10 font-semibold transition';
      });
      renderizarTarjetasServicios();
    });
  });

  document.getElementById('selectCategoriaAgendar')?.addEventListener('change', (e) => {
    filtroCategoria = e.target.value;
    renderizarTarjetasServicios();
  });

  document.getElementById('inputBuscarServicioAgendar')?.addEventListener('input', (e) => {
    textoBusqueda = e.target.value.toLowerCase().trim();
    renderizarTarjetasServicios();
  });
}

function renderizarTarjetasServicios() {
  const contenedor = document.getElementById('contenedorServiciosAgendar');
  if (!contenedor) return;

  const filtrados = todosLosServicios.filter(s => {
    // Los servicios Unisex también sirven para Mujer y para Hombre
    const pasaPub = filtroPublico === 'Todos' || s.publico === filtroPublico || s.publico === 'Unisex';
    const pasaCat = filtroCategoria === 'Todas' || s.categoria === filtroCategoria;
    const pasaTxt = !textoBusqueda ||
      s.nombre.toLowerCase().includes(textoBusqueda) ||
      s.categoria.toLowerCase().includes(textoBusqueda);
    return pasaPub && pasaCat && pasaTxt;
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/60">
        No hay servicios disponibles con el filtro seleccionado.
      </div>
    `;
    return;
  }

  const fmt = (n) => typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO');

  contenedor.innerHTML = filtrados.map(s => {
    const seleccionado = servicioSeleccionado && String(servicioSeleccionado.id) === String(s.id);
    const badgeColor = s.publico === 'Hombre'
      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
      : (s.publico === 'Mujer'
          ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
          : 'bg-purple-500/20 text-purple-300 border-purple-500/30');

    const claveIcono = obtenerClaveIconoCategoria(s.categoria);
    const svgHtml = typeof obtenerIcono === 'function' ? obtenerIcono(claveIcono, 'w-5 h-5') : '';

    return `
      <div data-id="${escapar(s.id)}"
        data-nombre="${escapar(s.nombre)}"
        data-precio="${s.precio}"
        data-duracion="${s.duracion_min || 45}"
        class="card-servicio-item tarjeta p-4 cursor-pointer hover:border-pink-400/60 transition flex items-center justify-between gap-3 ${seleccionado ? 'border-pink-400 bg-white/15' : ''}">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-400/20 text-pink-300 flex items-center justify-center shrink-0">
            ${svgHtml}
          </span>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-serif font-bold text-sm sm:text-base text-white">${escapar(s.nombre)}</h3>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${badgeColor}">
                ${escapar(s.publico)}
              </span>
            </div>
            <span class="text-xs text-white/60">${escapar(s.categoria)} · ${s.duracion_min || 45} min</span>
          </div>
        </div>
        <span class="font-bold text-amber-300 text-sm shrink-0">${fmt(s.precio)}</span>
      </div>
    `;
  }).join('');

  contenedor.querySelectorAll('.card-servicio-item').forEach(card => {
    card.addEventListener('click', () => {
      seleccionarServicio(
        Number(card.dataset.id),
        card.dataset.nombre,
        Number(card.dataset.precio),
        Number(card.dataset.duracion),
        card
      );
    });
  });
}

async function cargarEstilistas(idServicio = null) {
  const contenedor = document.getElementById('contenedorEstilistasAgendar');
  if (!contenedor) return;

  let estilistas = [];

  try {
    if (typeof pedir === 'function') {
      const resp = await pedir('/estilistas', 'GET');
      if (resp && resp.success && Array.isArray(resp.data)) {
        estilistas = resp.data;
      } else if (Array.isArray(resp)) {
        estilistas = resp;
      }
    }
  } catch (e) {}

  if (idServicio) {
    const filtradas = estilistas.filter(e =>
      (e.ids_servicios || '').split(',').includes(String(idServicio))
    );
    if (filtradas.length > 0) estilistas = filtradas;
  }

  const listaCompleta = [
    { id: 0, nombre: 'Cualquiera Disponible', especialidad: 'Asignación automática' },
    ...estilistas
  ];

  contenedor.innerHTML = listaCompleta.map(e => {
    const idEst = e.id_estilista ?? e.id;
    const nombreEst = e.nombres ? `${e.nombres} ${e.apellidos || ''}`.trim() : (e.nombre || e.usuario);
    const nota = e.num_calificaciones ? ` · ★ ${Number(e.promedio).toFixed(1)}` : '';
    const especEst = (e.servicios || e.especialidades || e.especialidad || 'Estilista Profesional') + nota;
    const seleccionada = String(estilistaSeleccionada.id) === String(idEst);

    return `
      <div data-id="${escapar(idEst)}"
        data-nombre="${escapar(nombreEst)}"
        class="card-estilista-item tarjeta p-4 cursor-pointer hover:border-pink-400/60 transition text-center ${seleccionada ? 'border-pink-400 bg-white/10' : ''}">
        <div class="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-pink-300 text-base mb-2">
          ${nombreEst.charAt(0).toUpperCase()}
        </div>
        <h3 class="font-bold text-sm text-white">${escapar(nombreEst)}</h3>
        <p class="text-[11px] text-white/60 mt-1">${escapar(especEst)}</p>
      </div>
    `;
  }).join('');

  contenedor.querySelectorAll('.card-estilista-item').forEach(card => {
    card.addEventListener('click', () => {
      seleccionarEstilista(Number(card.dataset.id), card.dataset.nombre, card);
    });
  });
}

async function actualizarDisponibilidadHorarios() {
  const grid = document.getElementById('gridHorarios');
  if (!grid) return;

  const fechaVal = document.getElementById('fechaCita')?.value;
  if (!fechaVal || !servicioSeleccionado) {
    grid.innerHTML = `<p class="col-span-full text-xs text-white/60">Selecciona un servicio y una fecha para consultar las horas disponibles.</p>`;
    return;
  }

  if (new Date(fechaVal + 'T12:00:00').getDay() === 0) {
    grid.innerHTML = `<p class="col-span-full text-xs text-amber-300">El salón no atiende los domingos. Selecciona otro día.</p>`;
    return;
  }

  grid.innerHTML = `<p class="col-span-full text-xs text-white/60">Consultando disponibilidad en el servidor...</p>`;

  try {
    const usuario = obtenerUsuarioLogueado();
    const idUsuario = usuario ? (usuario.id ?? usuario.id_usuario ?? '') : '';
    const params = new URLSearchParams({
      idServicio: servicioSeleccionado.id,
      fecha: fechaVal
    });
    if (idUsuario) params.set('idUsuario', idUsuario);
    if (estilistaSeleccionada.id) params.set('idEstilista', estilistaSeleccionada.id);

    let resp = null;
    if (typeof pedir === 'function') {
      resp = await pedir(`/disponibilidad?${params.toString()}`, 'GET');
    } else {
      const r = await fetch(`/api/disponibilidad?${params.toString()}`);
      resp = await r.json();
    }

    const horas = (resp && resp.success && resp.data && Array.isArray(resp.data.horas))
      ? resp.data.horas.map(convertirHoraA24)
      : [];

    if (horas.length === 0) {
      grid.innerHTML = `<p class="col-span-full text-xs text-rose-300">${escapar(resp?.message || 'No hay horas libres ese día. Prueba otra fecha u otra estilista.')}</p>`;
      return;
    }

    generarGridHorarios(horas);
  } catch (e) {
    grid.innerHTML = `<p class="col-span-full text-xs text-rose-300">No se pudo consultar la disponibilidad.</p>`;
  }
}

function generarGridHorarios(horas = []) {
  const grid = document.getElementById('gridHorarios');
  if (!grid) return;

  grid.innerHTML = horas.map(hora => {
    const hora24 = convertirHoraA24(hora);
    const esElegida = horaSeleccionada === hora24;

    return `
      <button type="button" onclick="seleccionarHora('${hora24}', this)"
        class="btn-hora-item py-2 px-3 rounded-lg border ${esElegida ? 'bg-white text-black border-white' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white'} transition font-semibold text-center">
        ${hora24}
      </button>
    `;
  }).join('');
}

window.seleccionarServicio = async function(id, nombre, precio, duracion, el) {
  document.querySelectorAll('.card-servicio-item').forEach(c => c.classList.remove('border-pink-400', 'bg-white/15'));
  if (el) el.classList.add('border-pink-400', 'bg-white/15');

  servicioSeleccionado = { id: Number(id), nombre, precio: Number(precio), duracion: Number(duracion) || 45 };
  horaSeleccionada = null;
  const btnPaso1 = document.getElementById('btnSiguientePaso1');
  if (btnPaso1) btnPaso1.disabled = false;

  await cargarEstilistas(id);
  actualizarResumen();
  await actualizarDisponibilidadHorarios();
};

window.seleccionarEstilista = async function(id, nombre, el) {
  document.querySelectorAll('.card-estilista-item').forEach(c => c.classList.remove('border-pink-400', 'bg-white/10'));
  if (el) el.classList.add('border-pink-400', 'bg-white/10');

  estilistaSeleccionada = { id: Number(id) || 0, nombre };
  horaSeleccionada = null;
  actualizarResumen();
  await actualizarDisponibilidadHorarios();
};

window.seleccionarHora = function(hora, el) {
  document.querySelectorAll('.btn-hora-item').forEach(b => b.classList.remove('bg-white', 'text-black', 'border-white'));
  if (el) el.classList.add('bg-white', 'text-black', 'border-white');

  horaSeleccionada = convertirHoraA24(hora);
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
    if (resPrecio) {
      resPrecio.textContent = typeof pesos === 'function'
        ? pesos(servicioSeleccionado.precio)
        : '$' + Number(servicioSeleccionado.precio).toLocaleString('es-CO');
    }
  }

  if (resEstilista) resEstilista.textContent = estilistaSeleccionada.nombre;

  const fechaVal = document.getElementById('fechaCita')?.value || '';
  if (resFechaHora) {
    resFechaHora.textContent = fechaVal && horaSeleccionada ? `${fechaVal} a las ${horaSeleccionada}` : 'Por seleccionar';
  }
}

window.irAPaso = async function(paso) {
  document.getElementById('paso1').classList.toggle('hidden', paso !== 1);
  document.getElementById('paso2').classList.toggle('hidden', paso !== 2);
  document.getElementById('paso3').classList.toggle('hidden', paso !== 3);

  const ind1 = document.getElementById('pasoIndicador1');
  const ind2 = document.getElementById('pasoIndicador2');
  const ind3 = document.getElementById('pasoIndicador3');

  if (ind1) ind1.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 1 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind2) ind2.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 2 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind3) ind3.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 3 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;

  if (paso === 3) {
    await actualizarDisponibilidadHorarios();
  }
};

document.getElementById('btnSiguientePaso1')?.addEventListener('click', () => irAPaso(2));
document.getElementById('btnSiguientePaso2')?.addEventListener('click', () => irAPaso(3));

document.getElementById('btnConfirmarCita')?.addEventListener('click', async () => {
  const alerta = document.getElementById('alertaAgendamiento');
  const btnConfirmar = document.getElementById('btnConfirmarCita');
  const usuario = obtenerUsuarioLogueado();

  if (!usuario) {
    mostrarAlertaAgendamiento(alerta, 'Debes iniciar sesión para confirmar tu cita. Redirigiendo...', false);
    setTimeout(() => { window.location.href = 'index.html?redirect=agendar.html'; }, 1500);
    return;
  }

  const idUsuario = Number(usuario.id ?? usuario.id_usuario ?? usuario.idUsuario);
  if (!idUsuario) {
    mostrarAlertaAgendamiento(alerta, 'No se identificó el ID de tu cuenta. Inicia sesión con una cuenta registrada en MySQL.', false);
    return;
  }

  if (!servicioSeleccionado || !Number(servicioSeleccionado.id)) {
    mostrarAlertaAgendamiento(alerta, 'Selecciona un servicio válido antes de continuar.', false);
    return;
  }

  const fechaVal = document.getElementById('fechaCita')?.value;
  if (!fechaVal || !horaSeleccionada) {
    mostrarAlertaAgendamiento(alerta, 'Por favor selecciona la fecha y hora de tu cita.', false);
    return;
  }

  const horaFormateada = convertirHoraA24(horaSeleccionada);
  const observaciones = document.getElementById('notasCita')?.value.trim() || '';

  const payload = {
    idUsuario: idUsuario,
    idServicio: Number(servicioSeleccionado.id),
    idEstilista: estilistaSeleccionada.id ? Number(estilistaSeleccionada.id) : null,
    fecha: fechaVal,
    hora: horaFormateada,
    observaciones
  };

  if (btnConfirmar) btnConfirmar.disabled = true;
  mostrarAlertaAgendamiento(alerta, 'Guardando tu cita en el servidor...', true);

  try {
    let resp = null;
    if (typeof pedir === 'function') {
      resp = await pedir('/citas', 'POST', payload);
    } else {
      const resHttp = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      resp = await resHttp.json();
      if (!resHttp.ok) resp.success = false;
    }

    // Revisar la respuesta del servidor ANTES de decir "éxito"
    if (!resp || resp.errorRed || !resp.success) {
      const msgError = (resp && (resp.message || resp.mensaje || resp.error)) || 'El servidor no pudo guardar la cita.';
      mostrarAlertaAgendamiento(alerta, msgError, false);
      if (btnConfirmar) btnConfirmar.disabled = false;
      await actualizarDisponibilidadHorarios();
      return;
    }

    mostrarAlertaAgendamiento(alerta, resp.message || 'Cita agendada con éxito. Redirigiendo a tu panel...', true);
    setTimeout(() => {
      const esAdmin = String(usuario.rol || '').toLowerCase().includes('admin');
      window.location.href = esAdmin ? 'admin.html' : 'panel.html';
    }, 1200);
  } catch (error) {
    console.error('Error al agendar cita:', error);
    mostrarAlertaAgendamiento(alerta, 'Error de conexión al intentar agendar la cita.', false);
    if (btnConfirmar) btnConfirmar.disabled = false;
  }
});

function procesarParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  const nombreServicio = params.get('servicio');
  if (!nombreServicio) return;

  const tarjetas = document.querySelectorAll('.card-servicio-item');
  let encontrada = false;

  tarjetas.forEach(t => {
    const nombreCard = t.dataset.nombre || t.textContent;
    if (!encontrada && nombreCard.toLowerCase() === nombreServicio.toLowerCase()) {
      t.click();
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      encontrada = true;
    }
  });

  if (!encontrada) {
    tarjetas.forEach(t => {
      const nombreCard = t.dataset.nombre || t.textContent;
      if (!encontrada && nombreCard.toLowerCase().includes(nombreServicio.toLowerCase())) {
        t.click();
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        encontrada = true;
      }
    });
  }
}

function mostrarAlertaAgendamiento(el, msj, ok) {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${ok ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl text-xs font-semibold`;
  el.style.display = 'block';
}

function escapar(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}