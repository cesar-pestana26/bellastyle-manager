// js/inicio.js - Gestor de Galería, Tienda de Productos y Visor Modal

const GALERIA_ITEMS = [
  { id: 1, titulo: 'Balayage Rubio Platinado', estilista: 'Atendido por Diana', tag: 'Coloración', url: 'img/fondo.webp' },
  { id: 2, titulo: 'Corte Bob Moderno & Peinado', estilista: 'Atendido por Carmen', tag: 'Cortes', url: 'img/logo.webp' },
  { id: 3, titulo: 'Manicura Rusa con Nail Art', estilista: 'Atendido por Sofía', tag: 'Uñas', url: 'img/rol_clienta.svg' },
  { id: 4, titulo: 'Peinado Novia con Ondas', estilista: 'Atendido por Diana', tag: 'Peinados', url: 'img/fondo.webp' },
  { id: 5, titulo: 'Keratina Alisante Espejo', estilista: 'Atendido por Carmen', tag: 'Tratamientos', url: 'img/logo.webp' },
  { id: 6, titulo: 'Pedicura Spa con Exfoliación', estilista: 'Atendido por Sofía', tag: 'Uñas', url: 'img/rol_clienta.svg' }
];

const PRODUCTOS_ITEMS = [
  { id: 1, nombre: 'Shampoo Reparador de Argán 500ml', categoria: 'Capilar', precio: '$48.000', tag: 'Más Vendido', icono: '🧴', desc: 'Libre de sulfatos, ideal para mantener el balayage brillante.' },
  { id: 2, nombre: 'Mascarilla Nutritiva Intensiva', categoria: 'Tratamientos', precio: '$55.000', tag: 'Recomendado', icono: '✨', desc: 'Restauración completa para cabellos secos o procesados.' },
  { id: 3, nombre: 'Sérum Termoprotector de Brillo', categoria: 'Styling', precio: '$38.000', tag: 'Nuevo', icono: '💧', desc: 'Protege contra el calor extremo del secador y la plancha.' },
  { id: 4, nombre: 'Aceite de Cutículas & Uñas', categoria: 'Manicura', precio: '$22.000', tag: 'Esencial', icono: '💅', desc: 'Hidratación natural a base de almendras dulces.' },
  { id: 5, nombre: 'Spray Fijador Extra Fuerte', categoria: 'Styling', precio: '$32.000', tag: 'Profesional', icono: '💨', desc: 'Fijación de larga duración sin dejar residuos blancos.' },
  { id: 6, nombre: 'Kit Matizador Violeta', categoria: 'Color', precio: '$68.000', tag: 'Edición Especial', icono: '💜', desc: 'Neutraliza reflejos amarillos en cabellos rubios.' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderizarGaleria();
  renderizarTienda();
  configurarVisorModal();
});

function renderizarGaleria() {
  const contenedor = document.getElementById('galeriaVitrina');
  if (!contenedor) return;

  contenedor.innerHTML = GALERIA_ITEMS.map(item => `
    <div class="tarjeta group cursor-pointer" onclick="abrirFotoModal('${item.url}', '${item.titulo} - ${item.estilista}')">
      <div class="h-56 bg-white/5 relative overflow-hidden flex items-center justify-center">
        <img src="${item.url}" alt="${item.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
        <span class="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-pink-300">
          ${item.tag}
        </span>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold font-serif text-white">${item.titulo}</h3>
        <p class="text-xs text-white/60 mt-1">${item.estilista}</p>
      </div>
    </div>
  `).join('');
}

function renderizarTienda() {
  const contenedor = document.getElementById('listaProductos');
  if (!contenedor) return;

  contenedor.innerHTML = PRODUCTOS_ITEMS.map(p => `
    <div class="tarjeta p-5 group">
      <div>
        <div class="h-36 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition">
          ${p.icono}
        </div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-pink-400">${p.categoria}</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80">${p.tag}</span>
        </div>
        <h3 class="text-sm font-bold text-white line-clamp-2">${p.nombre}</h3>
        <p class="text-xs text-white/60 mt-1 line-clamp-2">${p.desc}</p>
      </div>
      <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
        <span class="text-lg font-bold text-white">${p.precio}</span>
        <a href="index.html" class="btn-primario text-xs px-3 py-1.5">
          Comprar
        </a>
      </div>
    </div>
  `).join('');
}

function configurarVisorModal() {
  const visor = document.getElementById('visorFoto');
  if (!visor) return;

  visor.addEventListener('click', (e) => {
    if (e.target === visor) visor.close();
  });
}

window.abrirFotoModal = function(url, texto) {
  const visor = document.getElementById('visorFoto');
  const img = document.getElementById('visorImagen');
  const txt = document.getElementById('visorTexto');

  if (visor && img) {
    img.src = url;
    if (txt) txt.textContent = texto || '';
    visor.showModal();
  }
};