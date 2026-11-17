// js/servicios.js - Catálogo Detallado por Categorías y Variantes (Mujer / Hombre / Unisex)

const CATALOGO_COMPLETO = [
  {
    id_categoria: 'corte',
    nombre: 'Corte de Cabello',
    icono: 'corte',
    subservicios: [
      {
        id: 'corte-dama-cepillado',
        nombre: 'Corte Dama + Lavado y Cepillado',
        publico: 'Mujer',
        precio: 45000,
        duracion: 60,
        descripcion: 'Corte personalizado según la forma de tu rostro y textura capilar. Ideal para renovar puntas o mantener el largo con movimiento.',
        incluye: 'Diagnóstico capilar, lavado con shampoo nutritivo, corte y cepillado.'
      },
      {
        id: 'corte-dama-cambio-look',
        nombre: 'Corte Dama Cambio de Look / Capas',
        publico: 'Mujer',
        precio: 55000,
        duracion: 75,
        descripcion: 'Transformación de estilo con técnicas de degrafilado, capas largas, bob o butterfly cut con acabado de salón.',
        incluye: 'Asesoría de visagismo, lavado, corte de diseño, cepillado y ondas suaves.'
      },
      {
        id: 'corte-caballero-fade',
        nombre: 'Corte Caballero / Degradado (Fade)',
        publico: 'Hombre',
        precio: 28000,
        duracion: 40,
        descripcion: 'Corte masculino moderno (Low, Mid o High Fade), corte clásico a tijera o texturizado superior con acabado preciso a navaja.',
        incluye: 'Corte a máquina/tijera, marcación de contornos, lavado rápido y styling.'
      },
      {
        id: 'corte-caballero-barba',
        nombre: 'Corte Caballero + Ritual de Barba',
        publico: 'Hombre',
        precio: 42000,
        duracion: 60,
        descripcion: 'Servicio integral masculino: corte de cabello personalizado más perfilado, rebajado e hidratación de barba con toalla caliente.',
        incluye: 'Corte completo, perfilado a navaja, toalla caliente y aceite hidratante.'
      },
      {
        id: 'corte-infantil',
        nombre: 'Corte Infantil (Niña / Niño)',
        publico: 'Unisex',
        precio: 22000,
        duracion: 30,
        descripcion: 'Corte cómodo, rápido y cuidadoso adaptado para niños y niñas hasta los 12 años.',
        incluye: 'Corte estilizado, atomización hidratante y peinado final.'
      },
      {
        id: 'corte-flequillo-puntas',
        nombre: 'Corte de Flequillo o Limpieza de Puntas',
        publico: 'Mujer',
        precio: 18000,
        duracion: 20,
        descripcion: 'Mantenimiento rápido en seco para dar forma al flequillo cortina, recto o desfilado sin modificar el largo total.',
        incluye: 'Diseño de flequillo y pulido con plancha o secador.'
      }
    ]
  },
  {
    id_categoria: 'manicure',
    nombre: 'Manicure',
    icono: 'manicure',
    subservicios: [
      {
        id: 'mani-tradicional',
        nombre: 'Manicure Tradicional + Esmaltado',
        publico: 'Mujer',
        precio: 25000,
        duracion: 45,
        descripcion: 'Limpieza profunda de cutícula, limado de forma e hidratación con esmaltado tradicional de alto brillo.',
        incluye: 'Limpieza, exfoliación suave, base fortalecedora y tono a elección.'
      },
      {
        id: 'mani-semipermanente',
        nombre: 'Manicure Semipermanente (Gel)',
        publico: 'Mujer',
        precio: 48000,
        duracion: 60,
        descripcion: 'Esmaltado en gel curado en lámpara LED con duración de hasta 21 días sin perder brillo ni levantarse.',
        incluye: 'Manicura rusa combinada, nivelación ligera y esmaltado semipermanente.'
      },
      {
        id: 'mani-acrilicas-polygel',
        nombre: 'Uñas Esculpidas en Acrílico o Polygel',
        publico: 'Mujer',
        precio: 95000,
        duracion: 120,
        descripcion: 'Extensión y estructura de uñas con acabado natural o diseño artístico según el largo deseado.',
        incluye: 'Preparación de lámina, extensión esculpida, limado y esmaltado en gel.'
      },
      {
        id: 'mani-caballero',
        nombre: 'Manicure Ejecutivo / Spa Caballero',
        publico: 'Hombre',
        precio: 25000,
        duracion: 40,
        descripcion: 'Cuidado estético de manos masculinas: recorte, limado, retiro de cutícula, exfoliación y brillo mate natural.',
        incluye: 'Limpieza profunda, hidratación de manos y pulido natural.'
      }
    ]
  },
  {
    id_categoria: 'mechas',
    nombre: 'Mechas / Balayage',
    icono: 'mechas',
    subservicios: [
      {
        id: 'mechas-balayage',
        nombre: 'Balayage Completo + Matización',
        publico: 'Mujer',
        precio: 220000,
        duracion: 210,
        descripcion: 'Técnica a mano alzada que crea un degradado luminoso y natural desde la raíz hasta las puntas sin efecto raíz marcada.',
        incluye: 'Decoloración con protector de enlaces, matizante, mascarilla selladora y ondas.'
      },
      {
        id: 'mechas-babylights',
        nombre: 'Babylights / Iluminaciones Finas',
        publico: 'Mujer',
        precio: 190000,
        duracion: 180,
        descripcion: 'Micro-mechas sutiles en toda la cabellera que aportan dimensión, brillo y claridad uniforme.',
        incluye: 'Montaje fino, matización personalizada, hidratación y cepillado.'
      },
      {
        id: 'mechas-contorno',
        nombre: 'Iluminación de Contorno (Money Piece)',
        publico: 'Mujer',
        precio: 120000,
        duracion: 120,
        descripcion: 'Aclarado estratégico en los mechones frontales para iluminar el rostro sin procesar todo el cabello.',
        incluye: 'Decoloración frontal, matiz, tratamiento nutritivo y styling.'
      },
      {
        id: 'mechas-caballero',
        nombre: 'Reflejos / Mechas Platinadas Caballero',
        publico: 'Hombre',
        precio: 110000,
        duracion: 120,
        descripcion: 'Iluminaciones superiores o efecto platinado cenizo para cabello corto masculino con protección capilar.',
        incluye: 'Decoloración controlada, matizante plata y mascarilla reparadora.'
      }
    ]
  },
  {
    id_categoria: 'pedicure',
    nombre: 'Pedicure',
    icono: 'pedicure',
    subservicios: [
      {
        id: 'pedi-tradicional',
        nombre: 'Pedicure Tradicional + Exfoliación',
        publico: 'Unisex',
        precio: 32000,
        duracion: 50,
        descripcion: 'Limpieza integral de uñas, retiro de durezas en talones, exfoliación refrescante y masaje relajante.',
        incluye: 'Baño podal, limpieza de cutícula, exfoliación y esmaltado o brillo natural.'
      },
      {
        id: 'pedi-semipermanente',
        nombre: 'Pedicure Semipermanente en Gel',
        publico: 'Mujer',
        precio: 55000,
        duracion: 65,
        descripcion: 'Pedicure completo con esmaltado en gel de secado inmediato para lucir pies impecables por semanas.',
        incluye: 'Limpieza profunda, hidratación, esmaltado semipermanente y aceite de cutícula.'
      },
      {
        id: 'pedi-spa-clinico',
        nombre: 'Pedicure Spa Profundo / Caballero',
        publico: 'Hombre',
        precio: 45000,
        duracion: 60,
        descripcion: 'Tratamiento enfocado en aliviar fatiga, suavizar callosidades y mantener uñas limpias y saludables.',
        incluye: 'Sales minerales, exfoliación profunda, masaje podal e hidratación intensiva.'
      }
    ]
  },
  {
    id_categoria: 'peinado',
    nombre: 'Peinado para Evento',
    icono: 'peinado',
    subservicios: [
      {
        id: 'peinado-ondas-cepillado',
        nombre: 'Cepillado Profesional + Ondas de Salón',
        publico: 'Mujer',
        precio: 45000,
        duracion: 50,
        descripcion: 'Moldeado con secador y tenaza para lograr volumen, ondas glam o liso pulido con fijación flexible.',
        incluye: 'Termoprotección, cepillado, ondas y spray de brillo anti-frizz.'
      },
      {
        id: 'peinado-recogido-gala',
        nombre: 'Recogido o Semirecogido de Gala / Grado',
        publico: 'Mujer',
        precio: 85000,
        duracion: 90,
        descripcion: 'Peinado estructurado de alta duración ideal para bodas, grados, quince años y eventos formales.',
        incluye: 'Preparación de textura, montaje de recogido, ganchos y fijación prolongada.'
      },
      {
        id: 'peinado-trenzas',
        nombre: 'Trenzas de Diseño / Boxeadoras',
        publico: 'Unisex',
        precio: 55000,
        duracion: 75,
        descripcion: 'Trenzas pegadas, corona o boxeadoras con acabado limpio y gel hidratante sin residuos.',
        incluye: 'División geométrica, trenzado y sellado hidratante.'
      },
      {
        id: 'peinado-styling-hombre',
        nombre: 'Styling & Peinado Evento Caballero',
        publico: 'Hombre',
        precio: 25000,
        duracion: 30,
        descripcion: 'Lavado energizante, moldeado con secador y fijación con cera mate o pomada para eventos especiales.',
        incluye: 'Lavado, moldeado térmico y fijación de larga duración.'
      }
    ]
  },
  {
    id_categoria: 'tinte',
    nombre: 'Tinte / Coloración',
    icono: 'tinte',
    subservicios: [
      {
        id: 'tinte-completo',
        nombre: 'Coloración Global (Tinte Completo)',
        publico: 'Mujer',
        precio: 95000,
        duracion: 90,
        descripcion: 'Aplicación uniforme de color de raíz a puntas con tintes de baja oxidación que protegen la fibra capilar.',
        incluye: 'Diagnóstico de color, tinte completo, lavado post-color y cepillado.'
      },
      {
        id: 'tinte-retoque-raiz',
        nombre: 'Retoque de Raíz (Cobertura de Canas)',
        publico: 'Mujer',
        precio: 65000,
        duracion: 60,
        descripcion: 'Igualación de crecimiento hasta 3 cm con cobertura total de canas y refrescamiento de brillo en medios y puntas.',
        incluye: 'Aplicación en raíz, emulsión de brillo, lavado y secado.'
      },
      {
        id: 'tinte-bano-color',
        nombre: 'Baño de Color / Matización Sin Amoníaco',
        publico: 'Unisex',
        precio: 55000,
        duracion: 45,
        descripcion: 'Neutraliza reflejos amarillos o naranjas no deseados y devuelve vitalidad y espejo al tono actual.',
        incluye: 'Matizante sin amoníaco, sellador de cutícula y styling.'
      },
      {
        id: 'tinte-camuflaje-hombre',
        nombre: 'Camuflaje Natural de Canas Caballero',
        publico: 'Hombre',
        precio: 48000,
        duracion: 40,
        descripcion: 'Matización discreta en 15 minutos que reduce el aspecto de las canas sin dejar efecto teñido artificial.',
        incluye: 'Aplicación rápida, lavado revitalizante y peinado.'
      }
    ]
  },
  {
    id_categoria: 'tratamiento',
    nombre: 'Tratamiento Capilar',
    icono: 'tratamiento',
    subservicios: [
      {
        id: 'trat-hidratacion-profunda',
        nombre: 'Hidratación Profunda + Vapor de Ozono',
        publico: 'Mujer',
        precio: 75000,
        duracion: 60,
        descripcion: 'Recupera la elasticidad y suavidad en cabellos secos o maltratados mediante activos hidratantes y calor controlado.',
        incluye: 'Lavado detox, ampolla hidratante, vaporización y cepillado.'
      },
      {
        id: 'trat-keratina-organica',
        nombre: 'Alisado Progresivo / Keratina Orgánica',
        publico: 'Mujer',
        precio: 180000,
        duracion: 180,
        descripcion: 'Elimina el frizz hasta por 4 meses, aporta brillo espejo y reduce el volumen manteniendo movimiento natural.',
        incluye: 'Lavado purificante, aplicación de keratina libre de formol, sellado térmico.'
      },
      {
        id: 'trat-botox-capilar',
        nombre: 'Botox Capilar Reconstructor',
        publico: 'Unisex',
        precio: 110000,
        duracion: 90,
        descripcion: 'Rellena la fibra capilar con colágeno, ácido hialurónico y aminoácidos para reparar puntas abiertas y porosidad.',
        incluye: 'Reconstrucción profunda, sellado de cutícula y acabado suave.'
      },
      {
        id: 'trat-anticaida-hombre',
        nombre: 'Terapia Anticaída & Control Grasa',
        publico: 'Hombre',
        precio: 60000,
        duracion: 45,
        descripcion: 'Exfoliación del cuero cabelludo con activos botánicos que oxigenan el folículo y fortalecen la raíz.',
        incluye: 'Peeling capilar, masaje estimulante y tónico fortalecedor.'
      }
    ]
  }
];

let categoriaActivaId = 'corte';
let filtroPublicoActivo = 'Todos';
let subservicioActivo = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    localStorage.setItem('catalogoServiciosBellaStyle', JSON.stringify(CATALOGO_COMPLETO));
  } catch (e) {}

  actualizarHeaderSesion();
  renderizarTabsCategorias();
  seleccionarCategoria('corte');
});

function actualizarHeaderSesion() {
  try {
    const u = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (u) {
      const btnLogin = document.getElementById('navLoginBtn');
      const btnReg = document.getElementById('navRegistroBtn');
      if (btnLogin) btnLogin.style.display = 'none';
      if (btnReg) {
        const esAdmin = String(u.rol || '').toLowerCase().includes('admin');
        btnReg.href = esAdmin ? 'admin.html' : 'panel.html';
        btnReg.textContent = 'Ir a Mi Panel';
      }
    }
  } catch (e) {}
}

function renderizarTabsCategorias() {
  const contenedor = document.getElementById('tabsCategoriasServicios');
  if (!contenedor) return;

  contenedor.innerHTML = CATALOGO_COMPLETO.map(cat => {
    const activo = cat.id_categoria === categoriaActivaId;
    const svgIcon = typeof obtenerIcono === 'function' ? obtenerIcono(cat.icono, 'w-4 h-4') : '';
    return `
      <button type="button" onclick="seleccionarCategoria('${cat.id_categoria}')"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
          activo
            ? 'bg-pink-500/20 text-pink-300 border-pink-400 shadow-md shadow-pink-500/10'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
        }">
        ${svgIcon}
        <span>${cat.nombre}</span>
      </button>
    `;
  }).join('');
}

window.seleccionarCategoria = function(idCategoria) {
  categoriaActivaId = idCategoria;
  renderizarTabsCategorias();
  renderizarListaSubservicios();
};

window.filtrarPublicoServicio = function(publico) {
  filtroPublicoActivo = publico;

  document.querySelectorAll('.btn-filtro-publico').forEach(btn => {
    const esActivo = btn.dataset.publico === publico;
    btn.className = esActivo
      ? 'btn-filtro-publico px-3.5 py-1.5 rounded-full bg-white text-black font-bold transition'
      : 'btn-filtro-publico px-3.5 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10 hover:text-white font-semibold transition';
  });

  renderizarListaSubservicios();
};

function renderizarListaSubservicios() {
  const categoria = CATALOGO_COMPLETO.find(c => c.id_categoria === categoriaActivaId) || CATALOGO_COMPLETO[0];
  const listaEl = document.getElementById('listaSubservicios');
  const tituloLista = document.getElementById('tituloListaCategoria');
  const contadorEl = document.getElementById('contadorVariantesServicio');

  if (tituloLista) tituloLista.textContent = `Opciones en ${categoria.nombre}`;

  const filtrados = categoria.subservicios.filter(sub => {
    if (filtroPublicoActivo === 'Todos') return true;
    return sub.publico === filtroPublicoActivo;
  });

  if (contadorEl) {
    contadorEl.textContent = `Mostrando ${filtrados.length} ${filtrados.length === 1 ? 'opción' : 'opciones'}`;
  }

  if (!listaEl) return;

  if (filtrados.length === 0) {
    listaEl.innerHTML = `
      <div class="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/60">
        No hay servicios registrados bajo el filtro <strong>${filtroPublicoActivo}</strong> en esta categoría.
        <button type="button" onclick="filtrarPublicoServicio('Todos')" class="block mx-auto mt-2 text-pink-400 underline font-semibold">
          Ver todas las opciones
        </button>
      </div>
    `;
    return;
  }

  if (!subservicioActivo || !filtrados.some(s => s.id === subservicioActivo.id)) {
    subservicioActivo = filtrados[0];
  }

  const fmt = (n) => typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO');

  listaEl.innerHTML = filtrados.map(sub => {
    const seleccionado = subservicioActivo && subservicioActivo.id === sub.id;
    const badgeColor = sub.publico === 'Hombre'
      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
      : (sub.publico === 'Mujer'
          ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
          : 'bg-purple-500/20 text-purple-300 border-purple-500/30');

    return `
      <div onclick="seleccionarSubservicio('${sub.id}')"
        class="p-4 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
          seleccionado
            ? 'border-pink-400 bg-white/10 shadow-lg'
            : 'border-white/10 bg-white/[0.03] hover:bg-white/5 hover:border-white/25'
        }">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-sm text-white">${sub.nombre}</h3>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${badgeColor}">
              ${sub.publico}
            </span>
          </div>
          <p class="text-[11px] text-white/60 line-clamp-1">${sub.descripcion}</p>
        </div>

        <div class="text-right shrink-0">
          <strong class="text-sm font-bold text-amber-300 block">${fmt(sub.precio)}</strong>
          <span class="text-[10px] text-white/50">${sub.duracion} min</span>
        </div>
      </div>
    `;
  }).join('');

  actualizarPanelDetalle(categoria, subservicioActivo);
}

window.seleccionarSubservicio = function(idSubservicio) {
  const categoria = CATALOGO_COMPLETO.find(c => c.id_categoria === categoriaActivaId);
  if (!categoria) return;

  const encontrado = categoria.subservicios.find(s => s.id === idSubservicio);
  if (encontrado) {
    subservicioActivo = encontrado;
    renderizarListaSubservicios();
  }
};

function actualizarPanelDetalle(categoria, sub) {
  if (!sub) return;

  const fmt = (n) => typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO');
  const iconoEl = document.getElementById('detalleIconoGrande');
  if (iconoEl && typeof obtenerIcono === 'function') {
    iconoEl.innerHTML = obtenerIcono(categoria.icono, 'w-5 h-5');
  }

  document.getElementById('detalleCategoriaTag').textContent = categoria.nombre;
  document.getElementById('detallePublicoBox').textContent = sub.publico;
  document.getElementById('detalleDuracionBox').textContent = `${sub.duracion} min`;
  document.getElementById('detalleBadgePublico').textContent = sub.publico;
  document.getElementById('detalleTituloServicio').textContent = sub.nombre;
  document.getElementById('detalleDescripcionServicio').textContent = sub.descripcion;
  document.getElementById('detalleIncluyeTexto').textContent = sub.incluye;
  document.getElementById('detallePrecioServicio').textContent = fmt(sub.precio);
  document.getElementById('detalleDuracionPill').textContent = `${sub.duracion} min`;

  const btnAgendar = document.getElementById('btnAgendarSubservicio');
  if (btnAgendar) {
    const params = new URLSearchParams({
      categoria: categoria.id_categoria,
      servicio: sub.nombre,
      precio: sub.precio,
      duracion: sub.duracion
    });
    btnAgendar.href = `agendar.html?${params.toString()}`;
  }
}