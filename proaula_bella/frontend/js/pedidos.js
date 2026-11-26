const COLOR_PEDIDO = {
  'Pendiente': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Listo para recoger': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Entregado': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Cancelado': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
};
const ESTADOS_PEDIDO = ['Pendiente', 'Listo para recoger', 'Entregado', 'Cancelado'];

function etiquetaPedido(estado) {
  return `<span class="inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${COLOR_PEDIDO[estado] || ''}">${escapar(estado)}</span>`;
}

window.cargarPedidosAdmin = async function () {
  const tabla = document.getElementById('tablaPedidosAdmin');
  if (!tabla) return;
  const r = await pedir('/pedidos');
  if (!r.success || !r.data.length) {
    tabla.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-white/60">Todavía no hay pedidos de la tienda.</td></tr>';
    return;
  }
  tabla.innerHTML = r.data.map((p) => `
    <tr>
      <td class="p-3.5 font-mono text-white/60">#${p.id_pedido}</td>
      <td class="p-3.5 whitespace-nowrap">${escapar(p.fecha)}</td>
      <td class="p-3.5 font-semibold text-white">${escapar(p.clienta)}<span class="block text-[11px] font-normal text-white/50">${escapar(p.telefono || '')}</span></td>
      <td class="p-3.5">${escapar(p.detalle)}</td>
      <td class="p-3.5 font-bold text-amber-300 whitespace-nowrap">${pesos(p.total)}</td>
      <td class="p-3.5">${etiquetaPedido(p.estado)}</td>
      <td class="p-3.5 text-right">${p.estado === 'Cancelado' ? '<span class="text-white/40">—</span>'
        : `<select data-pedido="${p.id_pedido}" class="campo py-1.5 text-xs w-auto">${ESTADOS_PEDIDO.map((e) => `<option ${e === p.estado ? 'selected' : ''}>${e}</option>`).join('')}</select>`}</td>
    </tr>`).join('');
  tabla.querySelectorAll('[data-pedido]').forEach((sel) => sel.addEventListener('change', async () => {
    const r2 = await pedir(`/pedidos/${sel.dataset.pedido}/estado`, 'PUT', { estado: sel.value });
    if (typeof notificarAdmin === 'function') notificarAdmin(r2.message || (r2.success ? 'Pedido actualizado' : 'No se pudo actualizar'));
    window.cargarPedidosAdmin();
  }));
};

async function cargarMisPedidos() {
  const caja = document.getElementById('misPedidos');
  if (!caja) return;
  const r = await pedir('/pedidos');
  if (!r.success || !r.data.length) {
    caja.innerHTML = '<p class="text-xs text-white/60">Aún no has hecho pedidos. <a href="tienda.html" class="font-semibold text-pink-400 hover:text-pink-300">Ir a la tienda</a></p>';
    return;
  }
  caja.innerHTML = r.data.map((p) => `
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-white">Pedido #${p.id_pedido} · <span class="text-amber-300">${pesos(p.total)}</span></p>
        <p class="text-xs text-white/60">${escapar(p.fecha)} · ${escapar(p.detalle)}</p>
      </div>
      ${etiquetaPedido(p.estado)}
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('misPedidos')) cargarMisPedidos();
});
