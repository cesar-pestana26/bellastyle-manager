const ETIQUETA_PUBLICO = {
  Mujer: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  Hombre: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Unisex: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
};

function sinDatos(texto) {
  return `<p class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">${texto}</p>`;
}

function ordenarServicios(lista) {
  const orden = { Unisex: 0, Mujer: 1, Hombre: 2 };
  return lista.slice().sort((a, b) => (orden[a.publico] ?? 0) - (orden[b.publico] ?? 0));
}

async function inicioServicios() {
  const caja = document.getElementById('inicioServicios');
  const r = await pedir('/servicios');
  if (!r.success || !r.data.length) { caja.innerHTML = sinDatos('Pronto publicaremos nuestros servicios.'); return; }
  caja.innerHTML = ordenarServicios(r.data).map((s) => {
    const publico = s.publico || 'Unisex';
    return `<a href="servicios.html" class="tarjeta flex items-center justify-between gap-4 p-5 hover:border-pink-400/50 transition">
      <div class="min-w-0">
        <p class="font-serif text-lg font-bold text-white">${escapar(s.nombre)}</p>
        <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">${s.duracion_min} min
          <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ETIQUETA_PUBLICO[publico] || ETIQUETA_PUBLICO.Unisex}">${escapar(publico)}</span></p>
      </div>
      <p class="shrink-0 font-serif text-xl font-bold text-amber-300">${pesos(s.precio)}</p>
    </a>`;
  }).join('');
}

async function inicioEquipo() {
  const caja = document.getElementById('inicioEquipo');
  const r = await pedir('/estilistas');
  const activas = r.success ? r.data.filter((e) => e.estado === 'Activo') : [];
  if (!activas.length) { caja.innerHTML = sinDatos('Pronto conocerás a nuestro equipo.'); return; }
  caja.innerHTML = activas.map((e) => {
    const calificacion = Number(e.num_calificaciones)
      ? `<span class="text-amber-300 font-semibold">★ ${Number(e.promedio).toFixed(1)}</span> <span class="text-white/50">(${e.num_calificaciones})</span>`
      : '<span class="text-white/50">Nueva en el equipo</span>';
    return `<div class="tarjeta flex gap-4 p-5">
      <img src="/api/usuarios/${e.id_usuario}/foto" alt="" loading="lazy" class="h-16 w-16 shrink-0 rounded-2xl object-cover border border-white/10 bg-white/5">
      <div class="min-w-0">
        <p class="font-serif text-lg font-bold text-white">${escapar(e.nombres)} ${escapar(e.apellidos || '')}</p>
        <p class="text-xs font-semibold text-pink-400">${escapar(e.especialidad || 'Estilista')}</p>
        <p class="mt-1 text-xs text-white/60 line-clamp-2">${escapar(e.servicios || '')}</p>
        <p class="mt-1 text-xs">${calificacion}</p>
      </div>
    </div>`;
  }).join('');
}

async function inicioVitrina() {
  const caja = document.getElementById('inicioVitrina');
  const r = await pedir('/vitrina');
  if (!r.success || !r.data.length) { caja.innerHTML = sinDatos('Muy pronto verás aquí las fotos de nuestros trabajos.'); return; }
  caja.innerHTML = r.data.slice(0, 8).map((f) => `
    <button type="button" class="group relative overflow-hidden rounded-2xl border border-white/10 aspect-square" data-foto="${f.url}" data-texto="${escapar(f.descripcion || '')}">
      <img src="${f.url}" alt="${escapar(f.descripcion || 'Trabajo del salón')}" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
      ${f.descripcion ? `<span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs text-white">${escapar(f.descripcion)}</span>` : ''}
    </button>`).join('');
  caja.querySelectorAll('[data-foto]').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('visorImagen').src = b.dataset.foto;
    document.getElementById('visorTexto').textContent = b.dataset.texto;
    document.getElementById('visorFoto').showModal();
  }));
}

async function inicioProductos() {
  const caja = document.getElementById('inicioProductos');
  const r = await pedir('/productos');
  const activos = r.success ? r.data.filter((p) => p.estado === 'Activo') : [];
  if (!activos.length) { caja.innerHTML = sinDatos('Pronto tendremos productos a la venta.'); return; }
  caja.innerHTML = activos.slice(0, 4).map((p) => `
    <a href="tienda.html" class="tarjeta p-4 hover:border-pink-400/50 transition">
      ${imagenProducto(p, 'h-32')}
      <p class="mt-3 text-sm font-bold text-white line-clamp-2">${escapar(p.nombre)}</p>
      <p class="mt-1 font-bold text-amber-300">${pesos(p.precio)}</p>
    </a>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  inicioServicios();
  inicioEquipo();
  inicioVitrina();
  inicioProductos();
  const visor = document.getElementById('visorFoto');
  if (visor) visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  const hablar = document.getElementById('btnHablarBella');
  if (hablar) hablar.addEventListener('click', () => document.getElementById('chatBurbuja')?.click());
});
