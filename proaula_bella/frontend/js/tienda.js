let productosTienda = [];

function tarjetaTienda(p) {
  const agotado = Number(p.stock) < 1;
  return `<div class="tarjeta flex flex-col p-4">
    ${imagenProducto(p)}
    <p class="mt-3 text-sm font-bold text-white line-clamp-2 min-h-[2.5rem]">${escapar(p.nombre)}</p>
    <p class="mt-1 text-xs ${agotado ? 'text-rose-300' : 'text-white/60'}">${agotado ? 'Agotado' : `Disponibles: ${p.stock}`}</p>
    <div class="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
      <span class="text-lg font-bold text-amber-300">${pesos(p.precio)}</span>
      <button type="button" data-agregar="${p.id_producto}" class="btn-primario text-xs px-3 py-1.5 disabled:opacity-40" ${agotado ? 'disabled' : ''}>Agregar</button>
    </div>
  </div>`;
}

async function cargarTienda() {
  const caja = document.getElementById('listaProductos');
  const r = await pedir('/productos');
  productosTienda = r.success ? r.data.filter((p) => p.estado === 'Activo') : [];
  if (!productosTienda.length) {
    caja.innerHTML = '<p class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">Pronto tendremos productos a la venta.</p>';
    return;
  }
  caja.innerHTML = productosTienda.map(tarjetaTienda).join('');
  caja.querySelectorAll('[data-agregar]').forEach((b) => b.addEventListener('click', () => {
    const p = productosTienda.find((x) => x.id_producto === Number(b.dataset.agregar));
    const ok = agregarAlCarrito(p);
    b.textContent = ok ? '¡Agregado!' : 'Sin más unidades';
    setTimeout(() => { b.textContent = 'Agregar'; }, 1200);
  }));
}

function pintarCarrito() {
  const items = leerCarrito();
  const caja = document.getElementById('itemsCarrito');
  document.getElementById('cantidadCarrito').textContent = items.reduce((s, i) => s + i.cantidad, 0);
  document.getElementById('totalCarrito').textContent = pesos(totalCarrito(items));
  document.getElementById('btnHacerPedido').disabled = items.length === 0;
  if (!items.length) {
    caja.innerHTML = '<p class="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">Tu carrito está vacío.</p>';
    return;
  }
  caja.innerHTML = items.map((i) => `
    <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-white truncate">${escapar(i.nombre)}</p>
        <p class="text-xs text-white/60">${pesos(i.precio)} c/u · <span class="font-semibold text-white">${pesos(i.precio * i.cantidad)}</span></p>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" data-menos="${i.id}" class="h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/15" aria-label="Quitar uno">−</button>
        <span class="w-6 text-center text-sm font-bold text-white">${i.cantidad}</span>
        <button type="button" data-mas="${i.id}" class="h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/15" aria-label="Agregar uno">+</button>
      </div>
    </div>`).join('');
  caja.querySelectorAll('[data-menos]').forEach((b) => b.addEventListener('click', () => cambiarCantidad(Number(b.dataset.menos), -1)));
  caja.querySelectorAll('[data-mas]').forEach((b) => b.addEventListener('click', () => cambiarCantidad(Number(b.dataset.mas), 1)));
}

function abrirCarrito(abrir) {
  const panel = document.getElementById('carrito');
  panel.classList.toggle('translate-x-full', !abrir);
  panel.setAttribute('aria-hidden', String(!abrir));
  document.getElementById('fondoCarrito').classList.toggle('hidden', !abrir);
  if (abrir) pintarCarrito();
}

async function hacerPedido() {
  const alerta = document.getElementById('alertaCarrito');
  const usuario = obtenerUsuarioActual();
  if (!usuario || !localStorage.getItem('token')) {
    mostrarAlerta(alerta, 'Inicia sesión como clienta para hacer tu pedido. Tu carrito se guarda.', 'error');
    setTimeout(() => { window.location.href = 'index.html?rol=cliente&redirect=' + encodeURIComponent('tienda.html#carrito'); }, 1400);
    return;
  }
  if (!String(usuario.rol).toLowerCase().startsWith('client')) {
    mostrarAlerta(alerta, 'Solo las clientas pueden hacer pedidos.', 'error');
    return;
  }
  const boton = document.getElementById('btnHacerPedido');
  boton.disabled = true;
  const r = await pedir('/pedidos', 'POST', { items: leerCarrito().map((i) => ({ id: i.id, cantidad: i.cantidad })) });
  boton.disabled = false;
  if (!r.success) { mostrarAlerta(alerta, r.message || 'No se pudo hacer el pedido.', 'error'); return; }
  vaciarCarrito();
  mostrarAlerta(alerta, r.message, 'ok');
  cargarTienda();
}

document.addEventListener('DOMContentLoaded', () => {
  cargarTienda();
  document.getElementById('btnAbrirCarrito').addEventListener('click', () => abrirCarrito(true));
  document.getElementById('btnCerrarCarrito').addEventListener('click', () => abrirCarrito(false));
  document.getElementById('fondoCarrito').addEventListener('click', () => abrirCarrito(false));
  document.getElementById('btnHacerPedido').addEventListener('click', hacerPedido);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrirCarrito(false); });
  document.addEventListener('carrito-cambio', pintarCarrito);

  const menu = document.getElementById('btnCarritoMenu');
  if (menu) menu.addEventListener('click', (e) => { e.preventDefault(); abrirCarrito(true); });
  pintarCarrito();
  if (location.hash === '#carrito') abrirCarrito(true);
});
