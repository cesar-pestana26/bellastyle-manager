// js/galeria.js - Galería con fotos reales (galeria.html):
// la vitrina de las estilistas y del salón, y las fotos de cada servicio.
function tarjetaFoto(url, titulo, detalle) {
  return `<button type="button" class="group relative overflow-hidden rounded-2xl border border-white/10 aspect-[4/5] text-left" data-foto="${url}" data-texto="${escapar([titulo, detalle].filter(Boolean).join(' · '))}">
    <img src="${url}" alt="${escapar(titulo || 'Trabajo del salón')}" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
    <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
      ${titulo ? `<span class="block text-sm font-semibold text-white">${escapar(titulo)}</span>` : ''}
      ${detalle ? `<span class="block text-xs text-white/80">${escapar(detalle)}</span>` : ''}
    </span>
  </button>`;
}

async function cargarGaleria() {
  const caja = document.getElementById('galeriaVitrina');
  const [vitrina, servicios] = await Promise.all([pedir('/vitrina?todas=1'), pedir('/fotos-servicios')]);
  const fotos = [];
  if (vitrina.success) vitrina.data.forEach((f) => fotos.push(tarjetaFoto(f.url, f.descripcion, f.autor ? `Por ${f.autor}` : '')));
  if (servicios.success) servicios.data.forEach((f) => fotos.push(tarjetaFoto(f.url, f.servicio || 'Servicio del salón', '')));
  if (!fotos.length) {
    caja.innerHTML = '<p class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">Muy pronto verás aquí las fotos de nuestros trabajos. Las estilistas las suben desde su panel.</p>';
    return;
  }
  caja.innerHTML = fotos.join('');
  caja.querySelectorAll('[data-foto]').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('visorImagen').src = b.dataset.foto;
    document.getElementById('visorTexto').textContent = b.dataset.texto;
    document.getElementById('visorFoto').showModal();
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  cargarGaleria();
  const visor = document.getElementById('visorFoto');
  visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
});
