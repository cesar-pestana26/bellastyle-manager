// js/servicios.js - Menú de Servicios con Galería Interactiva de Fotos

// Fotos por servicio cargadas dinámicamente desde el backend
let fotosPorServicio = {};

// Servicios por defecto en caso de que el backend esté offline
const SERVICIOS_DEFAULT = [
  { id_servicio: 1, nombre: 'Corte de Cabello', precio: 35000, duracion_min: 45, categoria: 'Cortes' },
  { id_servicio: 2, nombre: 'Tinte / Coloración', precio: 90000, duracion_min: 90, categoria: 'Color' },
  { id_servicio: 3, nombre: 'Mechas / Balayage', precio: 180000, duracion_min: 180, categoria: 'Color' },
  { id_servicio: 4, nombre: 'Peinado para Evento', precio: 70000, duracion_min: 60, categoria: 'Peinados' },
  { id_servicio: 5, nombre: 'Manicure', precio: 45000, duracion_min: 60, categoria: 'Uñas' },
  { id_servicio: 6, nombre: 'Pedicure', precio: 40000, duracion_min: 50, categoria: 'Uñas' },
  { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 150000, duracion_min: 120, categoria: 'Tratamientos' }
];

// Descripción corta de cada servicio
const DESCRIPCIONES = {
  'corte-de-cabello': 'Corte a tu medida según la forma de tu rostro y tu tipo de cabello. Incluye lavado y secado.',
  'tinte-coloracion': 'Color uniforme y duradero con productos que cuidan tu cabello. Te asesoramos para elegir el tono ideal.',
  'mechas-balayage': 'Luces naturales hechas a mano para un efecto degradado y luminoso.',
  'peinado-para-evento': 'Recogidos, ondas y peinados especiales para bodas, grados, quinceañeros y fiestas.',
  'manicure': 'Limpieza, forma y esmaltado de uñas de las manos, con hidratación de cutículas.',
  'pedicure': 'Cuidado completo de pies: limpieza, exfoliación, forma de uñas y esmaltado.',
  'tratamiento-capilar': 'Hidratación profunda y nutrición para cabello seco, maltratado o con frizz.'
};

// Íconos SVG por clave de servicio
const ICONOS_SERVICIOS = {
  'corte-de-cabello': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  'tinte-coloracion': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  'mechas-balayage': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  'peinado-para-evento': '<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
  'manicure': '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  'pedicure': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0z"/>',
  'tratamiento-capilar': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
};
const ICONO_GENERAL = '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>';

// Fondos de las imágenes de muestra estilo glassmorphic
const DEGRADADOS = [
  'from-pink-500/20 to-purple-600/20 border-white/10',
  'from-purple-500/20 to-rose-500/20 border-white/10',
  'from-rose-500/20 to-pink-600/20 border-white/10'
];

// Funciones auxiliares de formateo y escape
function formatoPesos(num) {
  if (typeof pesos === 'function') return pesos(num);
  return '$' + Number(num || 0).toLocaleString('es-CO');
}

function escaparTexto(str) {
  if (typeof escapar === 'function') return escapar(str);
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function claveServicio(nombre) {
  return String(nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function iconoServicio(clave, clases) {
  return `<svg class="${clases}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS_SERVICIOS[clave] || ICONO_GENERAL}</svg>`;
}

// Renderizado de Galería (Fotos reales vs. Muestra con ícono)
function galeria(servicio, clave) {
  const fotos = fotosPorServicio[servicio.id_servicio] || [];
  
  if (fotos.length === 0) {
    const muestra = (i, grande) => `
      <div class="${grande ? 'col-span-2 row-span-2' : ''} grid aspect-square place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${DEGRADADOS[i % 3]} border text-pink-300">
        ${iconoServicio(clave, grande ? 'h-20 w-20 opacity-80' : 'h-10 w-10 opacity-70')}
      </div>`;
    return `<div class="grid grid-cols-3 grid-rows-2 gap-3">${muestra(0, true)}${muestra(1)}${muestra(2)}</div>`;
  }

  const miniaturas = fotos.length < 2 ? '' : `
    <div class="mt-3 grid grid-cols-6 gap-2">
      ${fotos.map((url, i) => `
        <button type="button" data-miniatura="${url}" aria-label="Ver foto ${i + 1}"
          class="aspect-square overflow-hidden rounded-xl ring-2 ${i === 0 ? 'ring-pink-400' : 'ring-transparent'} transition hover:ring-pink-300">
          <img src="${url}" alt="" loading="lazy" class="h-full w-full object-cover">
        </button>`).join('')}
    </div>`;

  return `
    <div>
      <div class="aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 border border-white/10">
        <img data-foto-grande src="${fotos[0]}" alt="${escaparTexto(servicio.nombre)}" class="h-full w-full object-cover">
      </div>
      ${miniaturas}
    </div>`;
}

// Vista detallada del servicio seleccionado
function detalleServicio(s) {
  const clave = claveServicio(s.nombre);
  return `
    <div class="grid animate-aparecer gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
      ${galeria(s, clave)}
      <div>
        <span class="text-xs font-semibold uppercase tracking-widest text-pink-400">Detalle del servicio</span>
        <h3 class="mt-1 text-3xl font-bold font-serif sm:text-4xl text-white">${escaparTexto(s.nombre)}</h3>
        <p class="mt-3 text-base text-white/70">${DESCRIPCIONES[clave] || 'Servicio realizado por nuestras estilistas capacitadas con productos profesionales de alta calidad.'}</p>
        
        <div class="mt-6 flex flex-wrap items-center gap-4">
          <span class="font-serif text-4xl font-bold text-amber-300">${formatoPesos(s.precio)}</span>
          <span class="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80">${s.duracion_min || 45} min</span>
        </div>
        
        <a href="agendar.html?servicio=${encodeURIComponent(s.nombre)}" class="btn-primario mt-8 px-6 py-3.5 text-sm inline-flex items-center gap-2">
          Agendar este servicio &rarr;
        </a>
      </div>
    </div>`;
}

// Dibujador principal del menú de servicios
async function dibujarMenuServicios(contenedor) {
  let servicios = SERVICIOS_DEFAULT;

  try {
    if (typeof pedir === 'function') {
      const [respServicios, respFotos] = await Promise.all([
        pedir('/servicios', 'GET').catch(() => null),
        pedir('/fotos-servicios', 'GET').catch(() => null)
      ]);

      if (respFotos && respFotos.data) {
        fotosPorServicio = {};
        respFotos.data.forEach((f) => {
          (fotosPorServicio[f.id_servicio] = fotosPorServicio[f.id_servicio] || []).push(f.url);
        });
      }

      if (respServicios && respServicios.success && Array.isArray(respServicios.data) && respServicios.data.length > 0) {
        servicios = respServicios.data;
      }
    }
  } catch (e) {
    console.log('Servidor offline o inaccesible. Cargando servicios de catálogo local.');
  }

  contenedor.innerHTML = `
    <!-- Filtros por Píldoras -->
    <div class="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none" role="tablist" aria-label="Servicios">
      ${servicios.map((s, i) => `
        <button type="button" role="tab" data-indice="${i}"
          class="pildora-cat ${i === 0 ? 'activa' : ''}">
          ${iconoServicio(claveServicio(s.nombre), 'w-4 h-4 mr-2')}
          <span>${escaparTexto(s.nombre)}</span>
        </button>`).join('')}
    </div>

    <!-- Panel de Detalle -->
    <div class="tarjeta mt-6 p-6 sm:p-8" data-detalle></div>`;

  const botones = contenedor.querySelectorAll('[data-indice]');
  const detalle = contenedor.querySelector('[data-detalle]');

  function escoger(i) {
    botones.forEach((b) => {
      const activo = Number(b.dataset.indice) === i;
      b.setAttribute('aria-selected', activo);
      if (activo) {
        b.classList.add('activa');
      } else {
        b.classList.remove('activa');
      }
    });

    detalle.innerHTML = detalleServicio(servicios[i]);

    // Interactividad de miniaturas
    detalle.querySelectorAll('[data-miniatura]').forEach((m) => {
      m.addEventListener('click', () => {
        const fotoGrande = detalle.querySelector('[data-foto-grande]');
        if (fotoGrande) fotoGrande.src = m.dataset.miniatura;
        
        detalle.querySelectorAll('[data-miniatura]').forEach((x) => {
          x.classList.toggle('ring-pink-400', x === m);
          x.classList.toggle('ring-transparent', x !== m);
        });
      });
    });
  }

  botones.forEach((b) => b.addEventListener('click', () => escoger(Number(b.dataset.indice))));
  escoger(0);
}

// Inicialización automática al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-menu-servicios]').forEach(dibujarMenuServicios);
});