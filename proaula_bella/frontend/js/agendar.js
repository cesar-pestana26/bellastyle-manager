// js/agendar.js - Gestor de Agendamiento con Catálogo Detallado, Iconos SVG y Estilistas Dinámicas

let servicioSeleccionado = null;
let estilistaSeleccionada = { id: 0, nombre: 'Cualquiera Disponible' };
let horaSeleccionada = null;

let todosLosServicios = [];
let filtroPublico = 'Todos';
let filtroCategoria = 'Todas';
let textoBusqueda = '';

const HORARIOS_JORNADA = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const CATALOGO_DETALLADO_DEFAULT = [
  { id: 'corte-dama-cepillado', categoria: 'Corte de Cabello', nombre: 'Corte Dama + Lavado y Cepillado', publico: 'Mujer', precio: 45000, duracion_min: 60, icono: 'corte' },
  { id: 'corte-dama-cambio-look', categoria: 'Corte de Cabello', nombre: 'Corte Dama Cambio de Look / Capas', publico: 'Mujer', precio: 55000, duracion_min: 75, icono: 'corte' },
  { id: 'corte-caballero-fade', categoria: 'Corte de Cabello', nombre: 'Corte Caballero / Degradado (Fade)', publico: 'Hombre', precio: 28000, duracion_min: 40, icono: 'corte' },
  { id: 'corte-caballero-barba', categoria: 'Corte de Cabello', nombre: 'Corte Caballero + Ritual de Barba', publico: 'Hombre', precio: 42000, duracion_min: 60, icono: 'corte' },
  { id: 'corte-infantil', categoria: 'Corte de Cabello', nombre: 'Corte Infantil (Niña / Niño)', publico: 'Unisex', precio: 22000, duracion_min: 30, icono: 'corte' },
  { id: 'corte-flequillo-puntas', categoria: 'Corte de Cabello', nombre: 'Corte de Flequillo o Limpieza de Puntas', publico: 'Mujer', precio: 18000, duracion_min: 20, icono: 'corte' },
  { id: 'mani-tradicional', categoria: 'Manicure', nombre: 'Manicure Tradicional + Esmaltado', publico: 'Mujer', precio: 25000, duracion_min: 45, icono: 'manicure' },
  { id: 'mani-semipermanente', categoria: 'Manicure', nombre: 'Manicure Semipermanente (Gel)', publico: 'Mujer', precio: 48000, duracion_min: 60, icono: 'manicure' },
  { id: 'mani-acrilicas-polygel', categoria: 'Manicure', nombre: 'Uñas Esculpidas en Acrílico o Polygel', publico: 'Mujer', precio: 95000, duracion_min: 120, icono: 'manicure' },
  { id: 'mani-caballero', categoria: 'Manicure', nombre: 'Manicure Ejecutivo / Spa Caballero', publico: 'Hombre', precio: 25000, duracion_min: 40, icono: 'manicure' },
  { id: 'mechas-balayage', categoria: 'Mechas / Balayage', nombre: 'Balayage Completo + Matización', publico: 'Mujer', precio: 220000, duracion_min: 210, icono: 'mechas' },
  { id: 'mechas-babylights', categoria: 'Mechas / Balayage', nombre: 'Babylights / Iluminaciones Finas', publico: 'Mujer', precio: 190000, duracion_min: 180, icono: 'mechas' },
  { id: 'mechas-contorno', categoria: 'Mechas / Balayage', nombre: 'Iluminación de Contorno (Money Piece)', publico: 'Mujer', precio: 120000, duracion_min: 120, icono: 'mechas' },
  { id: 'mechas-caballero', categoria: 'Mechas / Balayage', nombre: 'Reflejos / Mechas Platinadas Caballero', publico: 'Hombre', precio: 110000, duracion_min: 120, icono: 'mechas' },
  { id: 'pedi-tradicional', categoria: 'Pedicure', nombre: 'Pedicure Tradicional + Exfoliación', publico: 'Unisex', precio: 32000, duracion_min: 50, icono: 'pedicure' },
  { id: 'pedi-semipermanente', categoria: 'Pedicure', nombre: 'Pedicure Semipermanente en Gel', publico: 'Mujer', precio: 55000, duracion_min: 65, icono: 'pedicure' },
  { id: 'pedi-spa-clinico', categoria: 'Pedicure', nombre: 'Pedicure Spa Profundo / Caballero', publico: 'Hombre', precio: 45000, duracion_min: 60, icono: 'pedicure' },
  { id: 'peinado-ondas-cepillado', categoria: 'Peinado para Evento', nombre: 'Cepillado Profesional + Ondas de Salón', publico: 'Mujer', precio: 45000, duracion_min: 50, icono: 'peinado' },
  { id: 'peinado-recogido-gala', categoria: 'Peinado para Evento', nombre: 'Recogido o Semirecogido de Gala / Grado', publico: 'Mujer', precio: 85000, duracion_min: 90, icono: 'peinado' },
  { id: 'peinado-trenzas', categoria: 'Peinado para Evento', nombre: 'Trenzas de Diseño / Boxeadoras', publico: 'Unisex', precio: 55000, duracion_min: 75, icono: 'peinado' },
  { id: 'peinado-styling-hombre', categoria: 'Peinado para Evento', nombre: 'Styling & Peinado Evento Caballero', publico: 'Hombre', precio: 25000, duracion_min: 30, icono: 'peinado' },
  { id: 'tinte-completo', categoria: 'Tinte / Coloración', nombre: 'Coloración Global (Tinte Completo)', publico: 'Mujer', precio: 95000, duracion_min: 90, icono: 'tinte' },
  { id: 'tinte-retoque-raiz', categoria: 'Tinte / Coloración', nombre: 'Retoque de Raíz (Cobertura de Canas)', publico: 'Mujer', precio: 65000, duracion_min: 60, icono: 'tinte' },
  { id: 'tinte-bano-color', categoria: 'Tinte / Coloración', nombre: 'Baño de Color / Matización Sin Amoníaco', publico: 'Unisex', precio: 55000, duracion_min: 45, icono: 'tinte' },
  { id: 'tinte-camuflaje-hombre', categoria: 'Tinte / Coloración', nombre: 'Camuflaje Natural de Canas Caballero', publico: 'Hombre', precio: 48000, duracion_min: 40, icono: 'tinte' },
  { id: 'trat-hidratacion-profunda', categoria: 'Tratamiento Capilar', nombre: 'Hidratación Profunda + Vapor de Ozono', publico: 'Mujer', precio: 75000, duracion_min: 60, icono: 'tratamiento' },
  { id: 'trat-keratina-organica', categoria: 'Tratamiento Capilar', nombre: 'Alisado Progresivo / Keratina Orgánica', publico: 'Mujer', precio: 180000, duracion_min: 180, icono: 'tratamiento' },
  { id: 'trat-botox-capilar', categoria: 'Tratamiento Capilar', nombre: 'Botox Capilar Reconstructor', publico: 'Unisex', precio: 110000, duracion_min: 90, icono: 'tratamiento' },
  { id: 'trat-anticaida-hombre', categoria: 'Tratamiento Capilar', nombre: 'Terapia Anticaída & Control Grasa', publico: 'Hombre', precio: 60000, duracion_min: 45, icono: 'tratamiento' }
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
  let usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  if (!usuario) {
    try {
      usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    } catch (e) {}
  }

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
  inputFecha.addEventListener('change', actualizarResumen);
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

  let catalogoLS = [];
  try {
    catalogoLS = JSON.parse(localStorage.getItem('catalogoServiciosBellaStyle')) || [];
  } catch (e) {}

  if (Array.isArray(catalogoLS) && catalogoLS.length > 0) {
    const planificados = [];
    catalogoLS.forEach((cat) => {
      (cat.subservicios || []).forEach((sub) => {
        planificados.push({
          id: sub.id,
          categoria: cat.nombre,
          nombre: sub.nombre,
          publico: sub.publico || 'Unisex',
          precio: Number(sub.precio) || 0,
          duracion_min: Number(sub.duracion) || 45,
          icono: obtenerClaveIconoCategoria(cat.nombre)
        });
      });
    });
    todosLosServicios = planificados;
  } else {
    todosLosServicios = [...CATALOGO_DETALLADO_DEFAULT];
  }

  try {
    if (typeof pedir === 'function') {
      const resp = await pedir('/servicios', 'GET');
      if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        resp.data.forEach(srvApi => {
          const existe = todosLosServicios.some(
            s => s.nombre.toLowerCase() === String(srvApi.nombre || '').toLowerCase()
          );
          if (!existe) {
            todosLosServicios.push({
              id: srvApi.id_servicio || srvApi.id,
              categoria: srvApi.categoria || 'General',
              nombre: srvApi.nombre,
              publico: srvApi.publico || 'Unisex',
              precio: Number(srvApi.precio) || 0,
              duracion_min: Number(srvApi.duracion_min) || 45,
              icono: obtenerClaveIconoCategoria(srvApi.categoria || srvApi.nombre)
            });
          }
        });
      }
    }
  } catch (e) {}

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
    const pasaPub = filtroPublico === 'Todos' || s.publico === filtroPublico;
    const pasaCat = filtroCategoria === 'Todas' || s.categoria === filtroCategoria;
    const pasaTxt = !textoBusqueda ||
      s.nombre.toLowerCase().includes(textoBusqueda) ||
      s.categoria.toLowerCase().includes(textoBusqueda);
    return pasaPub && pasaCat && pasaTxt;
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/60">
        No hay servicios que coincidan con el filtro seleccionado.
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
        card.dataset.id,
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
      const url = idServicio ? `/estilistas?servicio=${encodeURIComponent(idServicio)}` : '/estilistas';
      const resp = await pedir(url, 'GET');
      if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        estilistas = resp.data;
      }
    }
  } catch (e) {}

  if (estilistas.length === 0) {
    try {
      const usuariosLocales = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];
      const deLS = usuariosLocales.filter(u => String(u.rol || '').toLowerCase().includes('estilista'));
      if (deLS.length > 0) {
        estilistas = deLS.map((e, index) => ({
          id: e.id || index + 1,
          nombre: e.nombre || e.nombres || e.usuario,
          especialidad: e.especialidad || e.profesion || 'Estilista Profesional'
        }));
      }
    } catch (e) {}
  }

  const estilistasBase = [
    { id: 101, nombre: 'Diana Carmen', especialidad: 'Especialista en Balayage & Color' },
    { id: 102, nombre: 'Sofía Martínez', especialidad: 'Manicura Rusa & Nail Art' }
  ];

  estilistasBase.forEach(base => {
    const yaEsta = estilistas.some(e => String(e.nombre || '').toLowerCase() === base.nombre.toLowerCase());
    if (!yaEsta) estilistas.push(base);
  });

  const listaCompleta = [
    { id: 0, nombre: 'Cualquiera Disponible', especialidad: 'Asignación automática' },
    ...estilistas
  ];

  contenedor.innerHTML = listaCompleta.map(e => {
    const idEst = e.id_estilista ?? e.id;
    const nombreEst = e.nombres ? `${e.nombres} ${e.apellidos || ''}`.trim() : (e.nombre || e.usuario);
    const especEst = e.especialidades || e.especialidad || 'Estilista Profesional';
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
      seleccionarEstilista(card.dataset.id, card.dataset.nombre, card);
    });
  });
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
  if (el) el.classList.add('border-pink-400', 'bg-white/15');

  servicioSeleccionado = { id, nombre, precio: Number(precio), duracion: Number(duracion) || 45 };
  const btnPaso1 = document.getElementById('btnSiguientePaso1');
  if (btnPaso1) btnPaso1.disabled = false;

  cargarEstilistas(id);
  actualizarResumen();
};

window.seleccionarEstilista = function(id, nombre, el) {
  document.querySelectorAll('.card-estilista-item').forEach(c => c.classList.remove('border-pink-400', 'bg-white/10'));
  if (el) el.classList.add('border-pink-400', 'bg-white/10');

  estilistaSeleccionada = { id, nombre };
  actualizarResumen();
};

window.seleccionarHora = function(hora, el) {
  document.querySelectorAll('.btn-hora-item').forEach(b => b.classList.remove('bg-white', 'text-black', 'border-white'));
  if (el) el.classList.add('bg-white', 'text-black', 'border-white');

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

window.irAPaso = function(paso) {
  document.getElementById('paso1').classList.toggle('hidden', paso !== 1);
  document.getElementById('paso2').classList.toggle('hidden', paso !== 2);
  document.getElementById('paso3').classList.toggle('hidden', paso !== 3);

  const ind1 = document.getElementById('pasoIndicador1');
  const ind2 = document.getElementById('pasoIndicador2');
  const ind3 = document.getElementById('pasoIndicador3');

  if (ind1) ind1.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 1 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind2) ind2.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 2 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
  if (ind3) ind3.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${paso >= 3 ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`;
};

document.getElementById('btnSiguientePaso1')?.addEventListener('click', () => irAPaso(2));
document.getElementById('btnSiguientePaso2')?.addEventListener('click', () => irAPaso(3));

document.getElementById('btnConfirmarCita')?.addEventListener('click', async () => {
  const alerta = document.getElementById('alertaAgendamiento');
  let usuario = typeof obtenerUsuarioActual === 'function' ? obtenerUsuarioActual() : null;
  if (!usuario) {
    try {
      usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    } catch (e) {}
  }

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
    cliente: usuario.nombre || usuario.usuario,
    id_servicio: servicioSeleccionado.id,
    servicio: servicioSeleccionado.nombre,
    id_estilista: estilistaSeleccionada.id,
    estilista: estilistaSeleccionada.nombre,
    fecha: fechaVal,
    hora: horaSeleccionada,
    precio: servicioSeleccionado.precio,
    valor: servicioSeleccionado.precio,
    notas: document.getElementById('notasCita')?.value.trim() || ''
  };

  mostrarAlertaAgendamiento(alerta, 'Procesando tu reserva...', true);

  try {
    if (typeof pedir === 'function') {
      await pedir('/citas', 'POST', payload);
    }
  } catch (e) {}

  try {
    const citasGuardadas = JSON.parse(localStorage.getItem('citasBellaStyle')) || [];
    citasGuardadas.unshift({ id: Date.now(), ...payload, estado: 'Confirmada' });
    localStorage.setItem('citasBellaStyle', JSON.stringify(citasGuardadas));
  } catch (e) {}

  mostrarAlertaAgendamiento(alerta, 'Cita agendada con éxito. Redirigiendo a tu panel...', true);
  setTimeout(() => {
    const esAdmin = String(usuario.rol || '').toLowerCase().includes('admin');
    window.location.href = esAdmin ? 'admin.html' : 'panel.html';
  }, 1500);
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