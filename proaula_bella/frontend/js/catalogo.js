const CLAVE_CARRITO = 'carritoBellaStyle';

function iconoProducto(nombre) {
  const n = String(nombre || '').toLowerCase();
  if (/shampoo|champ/.test(n)) return '🧴';
  if (/mascarilla|tratamiento|keratina/.test(n)) return '✨';
  if (/esmalte|uña|cut[ií]cula/.test(n)) return '💅';
  if (/spray|fijador|laca/.test(n)) return '💨';
  if (/s[ée]rum|aceite/.test(n)) return '💧';
  if (/tinte|color|matizador/.test(n)) return '🎨';
  return '🛍️';
}

function imagenProducto(p, alto = 'h-40') {
  return Number(p.tiene_foto)
    ? `<img src="/api/productos/${p.id_producto}/foto" alt="${escapar(p.nombre)}" loading="lazy" class="${alto} w-full rounded-xl object-cover">`
    : `<div class="${alto} w-full rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl" aria-hidden="true">${iconoProducto(p.nombre)}</div>`;
}

function leerCarrito() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; } catch (e) { return []; }
}

function guardarCarrito(items) {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items)); } catch (e) {  }
  if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
  document.dispatchEvent(new CustomEvent('carrito-cambio'));
}

function agregarAlCarrito(p) {
  const items = leerCarrito();
  const existente = items.find((i) => i.id === p.id_producto);
  const maximo = Number(p.stock) || 0;
  if (existente) {
    if (existente.cantidad >= maximo) return false;
    existente.cantidad += 1;
  } else {
    if (maximo < 1) return false;
    items.push({ id: p.id_producto, nombre: p.nombre, precio: Number(p.precio), stock: maximo, cantidad: 1 });
  }
  guardarCarrito(items);
  return true;
}

function cambiarCantidad(id, cambio) {
  const items = leerCarrito();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.cantidad = Math.min(Math.max(item.cantidad + cambio, 0), item.stock || 99);
  guardarCarrito(items.filter((i) => i.cantidad > 0));
}

function vaciarCarrito() {
  guardarCarrito([]);
}

function totalCarrito(items = leerCarrito()) {
  return items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
}
