// js/servicios.js - Catálogo de servicios cargado 100% desde MySQL (GET /api/servicios)

let catalogoServicios = [];
let fotosPorServicio = {};
let categoriaActual = 'Todas';
let publicoActual = 'Todos';
let servicioActivoId = null;

document.addEventListener('DOMContentLoaded', async () => {
  actualizarHeaderSesionServicios();
  await cargarCatalogoDesdeMySQL();
});

function actualizarHeaderSesionServicios() {
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
  } catch (e) {}

  const btnLogin = document.getElementById('navLoginBtn');
  const btnReg = document.getElementById('navRegistroBtn');
  if (usuario && btnLogin && btnReg) {
    const esAdmin = String(usuario.rol || '').toLowerCase().includes('admin');
    btnLogin.textContent = `Hola, ${usuario.nombre || usuario.usuario}`;
    btnLogin.href = esAdmin ? 'admin.html' : 'panel.html';
    btnReg.textContent = 'Mi Panel';
    btnReg.href = esAdmin ? 'admin.html' : 'panel.html';
  }
}

function obtenerClaveIconoServicio(texto) {
  const t = String(texto || '').toLowerCase();
  if (t.includes('corte')) return 'corte';
  if (t.includes('manicure')) return 'manicure';
  if (t.includes('mecha') || t.includes('balayage')) return 'mechas';
  if (t.includes('pedicure')) return 'pedicure';
  if (t.includes('peinado')) return 'peinado';
  if (t.includes('tinte') || t.includes('color')) return 'tinte';
  return 'tratamiento';
}

function descripcionPorDefecto(nombre) {
  const n = String(nombre || '').toLowerCase();
  if (n.includes('corte')) return 'Corte personalizado según la forma de tu rostro y textura capilar, con asesoría de nuestras especialistas.';
  if (n.includes('tinte') || n.includes('color')) return 'Coloración uniforme y duradera con productos profesionales que protegen y dan brillo a tu cabello.';
  if (n.includes('mecha') || n.includes('balayage')) return 'Iluminación y degradado natural adaptado a tu tono de piel y estilo.';
  if (n.includes('peinado')) return 'Peinado profesional para eventos sociales o diario con fijación duradera.';
  if (n.includes('manicure')) return 'Limpieza, limado, cuidado de cutícula y esmaltado profesional para tus manos.';
  if (n.includes('pedicure')) return 'Cuidado completo para tus pies con exfoliación, hidratación y esmaltado.';
  return 'Tratamiento profesional realizado por nuestras especialistas certificadas en BellaStyle.';
}

async function cargarCatalogoDesdeMySQL() {
  const listaCont = document.getElementById('listaSubservicios');
  if (listaCont) {
    listaCont.innerHTML = `<div class="p-6 text-center text-xs text-white/60">Cargando servicios desde la base de datos...</div>`;
  }

  try {
    const [respServicios, respFotos] = await Promise.all([
      pedir('/servicios', 'GET'),
      pedir('/fotos-servicios', 'GET').catch(() => ({ data: [] }))
    ]);

    const listaCruda = Array.isArray(respServicios) ? respServicios : (respServicios?.data || []);

    fotosPorServicio = {};
    const listaFotos = Array.isArray(respFotos) ? respFotos : (respFotos?.data || []);
    listaFotos.forEach((f) => {
      const idS = String(f.id_servicio);
      if (!fotosPorServicio[idS]) fotosPorServicio[idS] = [];
      fotosPorServicio[idS].push(f.url);
    });

    catalogoServicios = listaCruda.map((s) => {
      const id = s.id_servicio ?? s.id;
      return {
        id,
        nombre: s.nombre,
        precio: Number(s.precio) || 0,
        duracion: Number(s.duracion_min || s.duracion) || 45,
        categoria: s.categoria || 'Servicios del Salón',
        publico: s.publico || 'Unisex',
        descripcion: s.descripcion || descripcionPorDefecto(s.nombre),
        incluye: s.incluye || 'Diagnóstico personalizado, productos profesionales de alta gama y acabado de salón.',
        icono: obtenerClaveIconoServicio(s.categoria || s.nombre),
        fotos: fotosPorServicio[String(id)] || []
      };
    });
  } catch (e) {
    console.error('Error al cargar servicios desde MySQL:', e);
    catalogoServicios = [];
  }

  if (catalogoServicios.length === 0) {
    if (listaCont) {
      listaCont.innerHTML = `<div class="p-6 text-center text-xs text-rose-300">No se encontraron servicios registrados en MySQL.</div>`;
    }
    return;
  }

  renderizarTabsCategorias();
  renderizarListaServicios();
}

function renderizarTabsCategorias() {
  const cont = document.getElementById('tabsCategoriasServicios');
  if (!cont) return;

  const categoriasUnicas = ['Todas', ...new Set(catalogoServicios.map((s) => s.categoria))];
  if (!categoriasUnicas.includes(categoriaActual)) categoriaActual = 'Todas';

  cont.innerHTML = categoriasUnicas.map((cat) => {
    const activa = cat === categoriaActual;
    return `
      <button type="button" data-cat="${escaparServicios(cat)}"
        class="px-4 py-2 rounded-full text-xs font-bold transition ${
          activa
            ? 'bg-white text-black shadow-md'
            : 'bg-white/5 text-white/75 border border-white/10 hover:bg-white/15 hover:text-white'
        }">
        ${cat === 'Todas' ? 'Todos los Servicios' : escaparServicios(cat)}
      </button>
    `;
  }).join('');

  cont.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      categoriaActual = btn.dataset.cat;
      renderizarTabsCategorias();
      renderizarListaServicios();
    });
  });
}

window.filtrarPublicoServicio = function(publico) {
  publicoActual = publico;
  document.querySelectorAll('.btn-filtro-publico').forEach((btn) => {
    const activo = btn.dataset.publico === publico;
    btn.className = activo
      ? 'btn-filtro-publico px-3.5 py-1.5 rounded-full bg-white text-black font-bold transition'
      : 'btn-filtro-publico px-3.5 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10 hover:text-white font-semibold transition';
  });
  renderizarListaServicios();
};

function renderizarListaServicios() {
  const cont = document.getElementById('listaSubservicios');
  const contador = document.getElementById('contadorVariantesServicio');
  const tituloCat = document.getElementById('tituloListaCategoria');
  if (!cont) return;

  const filtrados = catalogoServicios.filter((s) => {
    const pasaCat = categoriaActual === 'Todas' || s.categoria === categoriaActual;
    // Los servicios Unisex también sirven para Mujer y para Hombre
    const pasaPub = publicoActual === 'Todos' || s.publico === publicoActual || s.publico === 'Unisex';
    return pasaCat && pasaPub;
  });

  if (tituloCat) {
    tituloCat.textContent = categoriaActual === 'Todas' ? 'Catálogo Completo (MySQL)' : categoriaActual;
  }
  if (contador) {
    contador.textContent = `Mostrando ${filtrados.length} ${filtrados.length === 1 ? 'opción' : 'opciones'}`;
  }

  if (filtrados.length === 0) {
    cont.innerHTML = `<div class="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/60">No hay servicios con los filtros seleccionados.</div>`;
    return;
  }

  if (!filtrados.some((s) => String(s.id) === String(servicioActivoId))) {
    servicioActivoId = filtrados[0].id;
  }

  const fmt = (n) => (typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO'));

  cont.innerHTML = filtrados.map((s) => {
    const activo = String(s.id) === String(servicioActivoId);
    const svgHtml = typeof obtenerIcono === 'function' ? obtenerIcono(s.icono, 'w-4 h-4') : '';
    return `
      <button type="button" data-id-srv="${escaparServicios(s.id)}"
        class="w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
          activo
            ? 'border-pink-400 bg-white/15 shadow-lg'
            : 'border-white/10 bg-white/5 hover:border-pink-400/50 hover:bg-white/10'
        }">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-400/25 text-pink-300 flex items-center justify-center shrink-0">
            ${svgHtml}
          </span>
          <div class="min-w-0">
            <p class="font-bold text-sm text-white truncate">${escaparServicios(s.nombre)}</p>
            <p class="text-[11px] text-white/60">${s.duracion} min · ${escaparServicios(s.publico)}</p>
          </div>
        </div>
        <strong class="font-serif text-base font-bold text-amber-300 shrink-0">${fmt(s.precio)}</strong>
      </button>
    `;
  }).join('');

  cont.querySelectorAll('[data-id-srv]').forEach((btn) => {
    btn.addEventListener('click', () => {
      servicioActivoId = btn.dataset.idSrv;
      renderizarListaServicios();
    });
  });

  const seleccionado = filtrados.find((s) => String(s.id) === String(servicioActivoId)) || filtrados[0];
  actualizarPanelDetalleServicio(seleccionado);
}

function actualizarPanelDetalleServicio(srv) {
  if (!srv) return;
  const fmt = (n) => (typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO'));

  const iconoGrande = document.getElementById('detalleIconoGrande');
  if (iconoGrande && typeof obtenerIcono === 'function') {
    iconoGrande.innerHTML = obtenerIcono(srv.icono, 'w-5 h-5');
  }

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('detalleCategoriaTag', srv.categoria);
  setText('detallePublicoBox', srv.publico);
  setText('detalleDuracionBox', `${srv.duracion} min`);
  setText('detalleBadgePublico', srv.publico);
  setText('detalleTituloServicio', srv.nombre);
  setText('detalleDescripcionServicio', srv.descripcion);
  setText('detalleIncluyeTexto', srv.incluye);
  setText('detallePrecioServicio', fmt(srv.precio));
  setText('detalleDuracionPill', `${srv.duracion} min`);

  const btnAgendar = document.getElementById('btnAgendarSubservicio');
  if (btnAgendar) {
    btnAgendar.href = `agendar.html?servicio=${encodeURIComponent(srv.nombre)}`;
  }

  // Galería real del servicio si la administradora subió fotos en MySQL
  let galeriaEl = document.getElementById('galeriaDetalleServicio');
  if (!galeriaEl) {
    const incluyeBox = document.getElementById('detalleIncluyeBox');
    if (incluyeBox) {
      incluyeBox.insertAdjacentHTML('afterend', '<div id="galeriaDetalleServicio" class="space-y-2"></div>');
      galeriaEl = document.getElementById('galeriaDetalleServicio');
    }
  }

  if (galeriaEl) {
    if (srv.fotos && srv.fotos.length > 0) {
      galeriaEl.innerHTML = `
        <span class="text-[10px] uppercase tracking-wider text-pink-300 font-bold block">Fotos reales del servicio:</span>
        <div class="grid grid-cols-3 gap-2">
          ${srv.fotos.slice(0, 3).map((url) => `
            <div class="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <img src="${escaparServicios(url)}" alt="${escaparServicios(srv.nombre)}" class="h-full w-full object-cover">
            </div>
          `).join('')}
        </div>
      `;
    } else {
      galeriaEl.innerHTML = '';
    }
  }
}

function escaparServicios(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}