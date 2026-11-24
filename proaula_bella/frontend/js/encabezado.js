// js/encabezado.js - Encabezado único de las páginas públicas.
// Cada página pone <header id="encabezado"></header> y este archivo justo debajo.
// Así todas muestran el mismo menú: Inicio, Servicios, Galería, Tienda, carrito,
// botón de tema y la sesión (Iniciar sesión / Mi panel). En celular el menú se abre
// con el botón de tres rayas.
(function () {
  const destino = document.getElementById('encabezado');
  if (!destino) return;

  const pagina = (location.pathname.split('/').pop() || 'welcome.html').toLowerCase();
  const enlaces = [
    ['welcome.html', 'Inicio'],
    ['servicios.html', 'Servicios'],
    ['galeria.html', 'Galería'],
    ['tienda.html', 'Tienda']
  ];

  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem('usuarioLogueado')); } catch (e) { usuario = null; }
  const rol = String(usuario && usuario.rol || '').toLowerCase();
  const panel = rol.startsWith('admin') ? 'admin.html'
    : rol.startsWith('estilista') ? 'panel.html?rol=estilista' : 'panel.html?rol=cliente';
  const primerNombre = usuario && usuario.nombre ? String(usuario.nombre).split(' ')[0] : '';
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  const linkEscritorio = ([url, texto]) => url === pagina
    ? `<a href="${url}" class="text-pink-400 font-semibold" aria-current="page">${texto}</a>`
    : `<a href="${url}" class="hover:text-pink-400 transition">${texto}</a>`;
  const linkMovil = ([url, texto]) => `<a href="${url}" class="block rounded-xl px-4 py-3 text-base font-semibold ${url === pagina ? 'bg-pink-500/15 text-pink-400' : 'text-white/85 hover:bg-white/5'}">${texto}</a>`;

  const sesionEscritorio = usuario
    ? `<a href="${panel}" class="hidden sm:inline whitespace-nowrap text-sm font-semibold text-pink-400 hover:text-pink-300 transition">Hola, ${esc(primerNombre)}</a>
       <a href="${panel}" class="whitespace-nowrap px-4 py-2 text-xs sm:text-sm rounded-full bg-white text-black font-semibold hover:bg-pink-400 hover:text-white transition">Mi panel</a>`
    : `<a href="index.html" class="hidden sm:inline whitespace-nowrap text-sm font-semibold px-3 py-2 text-white/80 hover:text-white transition">Iniciar sesión</a>
       <a href="register.html?rol=cliente" class="hidden sm:inline-flex whitespace-nowrap px-4 py-2 text-sm rounded-full bg-white text-black font-semibold hover:bg-pink-400 hover:text-white transition">Crear cuenta</a>`;

  const sesionMovil = usuario
    ? `<a href="${panel}" class="block rounded-xl bg-pink-500 px-4 py-3 text-center text-base font-semibold text-white">Mi panel (${esc(primerNombre)})</a>`
    : `<a href="index.html" class="block rounded-xl border border-white/15 px-4 py-3 text-center text-base font-semibold text-white">Iniciar sesión</a>
       <a href="register.html?rol=cliente" class="block rounded-xl bg-pink-500 px-4 py-3 text-center text-base font-semibold text-white">Crear cuenta</a>`;

  destino.className = 'sticky top-0 z-50 border-b border-white/10 bg-[#07060b]/80 backdrop-blur-md';
  destino.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
      <a href="welcome.html" class="flex items-center gap-3 shrink-0">
        <img src="img/logo.webp" alt="Logo BellaStyle" class="h-9 w-9 rounded-full object-cover shadow-md shadow-pink-500/20">
        <span class="font-serif text-xl font-bold text-white">Bella<span class="text-pink-400">Style</span></span>
      </a>
      <nav class="hidden lg:flex items-center gap-6 text-sm font-medium text-white/80" aria-label="Menú principal">
        ${enlaces.map(linkEscritorio).join('')}
      </nav>
      <div class="flex items-center gap-2 sm:gap-3">
        <a href="tienda.html#carrito" id="btnCarritoMenu" class="relative rounded-full border border-white/15 bg-white/5 p-2 text-white hover:bg-white/15 transition" aria-label="Ver carrito">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <span id="contadorCarrito" class="absolute -right-1.5 -top-1.5 hidden min-w-[1.15rem] rounded-full bg-pink-500 px-1 text-center text-[10px] font-bold leading-[1.15rem] text-white">0</span>
        </a>
        <button type="button" data-instalar-app class="hidden whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full bg-pink-500 text-white hover:bg-pink-400 transition" title="Instalar BellaStyle como aplicación">Instalar app</button>
        <button type="button" class="btn-toggle-tema hidden lg:flex whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white transition items-center gap-1.5"></button>
        ${sesionEscritorio}
        <button type="button" id="btnMenuMovil" class="lg:hidden rounded-full border border-white/15 bg-white/5 p-2 text-white" aria-label="Abrir menú" aria-expanded="false" aria-controls="menuMovil">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="menuMovil" class="lg:hidden hidden border-t border-white/10 bg-[#07060b]/95 px-4 pb-5 pt-3">
      <nav class="space-y-1" aria-label="Menú del celular">${enlaces.map(linkMovil).join('')}</nav>
      <div class="mt-4 grid gap-2">
        <button type="button" class="btn-toggle-tema flex justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white items-center gap-2"></button>
        ${sesionMovil}
      </div>
    </div>`;

  const boton = document.getElementById('btnMenuMovil');
  const menu = document.getElementById('menuMovil');
  boton.addEventListener('click', () => {
    const abierto = menu.classList.toggle('hidden') === false;
    boton.setAttribute('aria-expanded', String(abierto));
  });

  // Número de productos en el carrito (se guarda en el navegador)
  window.actualizarContadorCarrito = function () {
    let total = 0;
    try { (JSON.parse(localStorage.getItem('carritoBellaStyle')) || []).forEach((i) => { total += Number(i.cantidad) || 0; }); } catch (e) { total = 0; }
    const c = document.getElementById('contadorCarrito');
    if (!c) return;
    c.textContent = total;
    c.classList.toggle('hidden', total === 0);
  };
  window.actualizarContadorCarrito();
})();
