// js/pagos.js - Pasarela de Pagos y Comprobantes conectada 100% a MySQL (/api/pagos)

let citaEnProcesoPago = null;
let metodoPagoSeleccionado = 'BreB';
let datosCobroSalon = null;   // llave Bre-B, titular y QR del salón (GET /api/pago-salon)
let callbackPagoCompletado = null;
let cachePagosPorCita = {};

document.addEventListener('DOMContentLoaded', () => {
  inyectarModalesPago();
});

function formatearMonedaPago(valor) {
  if (typeof pesos === 'function') return pesos(valor);
  return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function escaparTextoPago(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inyectarModalesPago() {
  if (document.getElementById('modalPasarelaPago')) return;

  const ico = (k) => typeof obtenerIcono === 'function' ? obtenerIcono(k, 'w-4 h-4') : '';

  const html = `
    <dialog id="modalPasarelaPago" class="max-w-lg w-full rounded-2xl bg-[#120f1d] p-6 text-white border border-white/20 backdrop:bg-black/80 shadow-2xl">
      <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-pink-400 font-bold block">Checkout Seguro</span>
          <h3 class="font-serif font-bold text-lg text-white">Pagar Servicio Agendado</h3>
        </div>
        <button type="button" onclick="cerrarModalPago()" class="text-white/50 hover:text-white text-lg font-bold">&times;</button>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-white/10 mb-4 space-y-1.5 text-xs">
        <div class="flex justify-between">
          <span class="text-white/50">Servicio:</span>
          <strong id="pagoResumenServicio" class="text-white">-</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-white/50">Estilista:</span>
          <span id="pagoResumenEstilista" class="text-pink-300 font-semibold">-</span>
        </div>
        <div class="flex justify-between">
          <span class="text-white/50">Fecha y Hora:</span>
          <span id="pagoResumenFecha" class="text-white/80">-</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-white/10 text-sm">
          <span class="text-white/70 font-semibold">Total a Pagar:</span>
          <strong id="pagoResumenMonto" class="text-amber-300 font-serif text-base">$0</strong>
        </div>
      </div>

      <div id="alertaPagoModal" class="hidden mb-3 rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-2 text-xs text-rose-200"></div>

      <div class="space-y-3">
        <label class="text-xs text-white/70 font-semibold block">Selecciona el método de pago:</label>
        <div class="grid grid-cols-2 gap-2 text-xs" id="selectorMetodosPago">
          <button type="button" onclick="seleccionarMetodoPago('BreB')" data-metodo="BreB"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-pink-400 bg-pink-500/20 text-white font-bold flex items-center justify-center gap-1.5 transition">
            ${ico('celular')}
            <span>Bre-B (QR o llave)</span>
          </button>
          <button type="button" onclick="seleccionarMetodoPago('Salon')" data-metodo="Salon"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition">
            ${ico('salon')}
            <span>En el salón</span>
          </button>
        </div>

        <form id="formProcesarPago" class="space-y-3 pt-2">
          <div id="camposMetodoPago" class="space-y-3"></div>

          <div class="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button type="button" onclick="cerrarModalPago()" class="btn-secundario text-xs px-4 py-2">Cancelar</button>
            <button type="submit" id="btnConfirmarTransaccion" class="btn-primario text-xs px-5 py-2.5 font-bold">
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <dialog id="modalComprobantePago" class="max-w-md w-full rounded-2xl bg-[#120f1d] p-6 text-white border border-white/20 backdrop:bg-black/80 shadow-2xl">
      <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Comprobante Oficial</span>
        <button type="button" onclick="document.getElementById('modalComprobantePago').close()" class="text-white/50 hover:text-white text-lg font-bold">&times;</button>
      </div>
      <div id="contenidoComprobante" class="space-y-4 text-xs"></div>
      <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-white/10">
        <button type="button" onclick="window.print()" class="btn-secundario text-xs px-4 py-2 inline-flex items-center gap-1.5">
          ${ico('impresora')}
          <span>Imprimir</span>
        </button>
        <button type="button" onclick="document.getElementById('modalComprobantePago').close()" class="btn-primario text-xs px-5 py-2">Cerrar</button>
      </div>
    </dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  renderizarCamposMetodoPago('BreB');

  document.getElementById('formProcesarPago')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await procesarTransaccionPago();
  });
}

window.cargarPagosDesdeServidor = async function(rol = '', idUsuario = '') {
  const params = new URLSearchParams();
  if (rol) params.set('rol', rol);
  if (idUsuario) params.set('idUsuario', idUsuario);
  const query = params.toString() ? `?${params.toString()}` : '';

  const resp = await pedir(`/pagos${query}`, 'GET').catch(() => null);
  const lista = (resp && resp.success && Array.isArray(resp.data)) ? resp.data : [];

  cachePagosPorCita = {};
  lista.forEach((p) => {
    cachePagosPorCita[String(p.id_cita)] = p;
  });
  return lista;
};

window.obtenerPagoPorCita = function(idCita) {
  return cachePagosPorCita[String(idCita)] || null;
};

window.abrirPasarelaPago = function(cita, onSuccess = null) {
  inyectarModalesPago();
  citaEnProcesoPago = cita;
  callbackPagoCompletado = onSuccess;

  const alerta = document.getElementById('alertaPagoModal');
  if (alerta) alerta.classList.add('hidden');

  const monto = Number(cita.precio || cita.valor || 0);
  document.getElementById('pagoResumenServicio').textContent = cita.servicio;
  document.getElementById('pagoResumenEstilista').textContent = cita.estilista || 'Por asignar';
  document.getElementById('pagoResumenFecha').textContent = `${cita.fecha} · ${cita.hora}`;
  document.getElementById('pagoResumenMonto').textContent = formatearMonedaPago(monto);

  seleccionarMetodoPago('BreB');

  const modal = document.getElementById('modalPasarelaPago');
  if (modal && !modal.open) modal.showModal();

  // Datos de cobro del salón: se leen cada vez que se abre, por si la administradora los cambió
  pedir('/pago-salon').then((r) => {
    datosCobroSalon = (r && r.success) ? r.data : null;
    if (metodoPagoSeleccionado === 'BreB') renderizarCamposMetodoPago('BreB');
  });
};

window.cerrarModalPago = function() {
  const modal = document.getElementById('modalPasarelaPago');
  if (modal) modal.close();
};

window.seleccionarMetodoPago = function(metodo) {
  metodoPagoSeleccionado = metodo;

  document.querySelectorAll('.btn-metodo-pago').forEach(btn => {
    const activo = btn.dataset.metodo === metodo;
    btn.className = activo
      ? 'btn-metodo-pago py-2.5 px-2 rounded-xl border border-pink-400 bg-pink-500/20 text-white font-bold flex items-center justify-center gap-1.5 transition'
      : 'btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition';
  });

  renderizarCamposMetodoPago(metodo);
};

function renderizarCamposMetodoPago(metodo) {
  const cont = document.getElementById('camposMetodoPago');
  const btn = document.getElementById('btnConfirmarTransaccion');
  if (!cont) return;

  if (metodo === 'BreB') {
    const d = datosCobroSalon;
    if (!d || (!d.llave && !d.qr)) {
      if (btn) btn.classList.add('hidden');
      cont.innerHTML = `<div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
        El salón todavía no ha configurado su QR de Bre-B. Por ahora elige <strong>En el salón</strong>.</div>`;
      return;
    }
    if (btn) { btn.classList.remove('hidden'); btn.textContent = 'Ya pagué, enviar comprobante'; }
    const monto = formatearMonedaPago(Number(citaEnProcesoPago && (citaEnProcesoPago.precio || citaEnProcesoPago.valor) || 0));
    cont.innerHTML = `
      <div class="grid gap-4 sm:grid-cols-[10rem_1fr] items-start">
        ${d.qr ? `<div class="space-y-2">
          <button type="button" id="btnAmpliarQR" class="block w-40 mx-auto" aria-label="Ver el QR en grande">
            <img src="${d.qr}" alt="Código QR Bre-B del salón" class="w-40 h-40 rounded-xl bg-white p-2 object-contain">
          </button>
          <div class="grid grid-cols-2 gap-1.5 w-40 mx-auto">
            <button type="button" id="btnVerQRGrande" class="btn-secundario text-[10px] px-2 py-1.5">Ver grande</button>
            <a href="${d.qr}" download="QR-BreB-BellaStyle.png" class="btn-secundario text-[10px] px-2 py-1.5 text-center">Descargar</a>
          </div>
        </div>` : ''}
        <div class="space-y-2 text-[11px] ${d.qr ? '' : 'sm:col-span-2'}">
          <p class="text-white/70">1. Abre la app de tu banco o billetera (Nequi, Daviplata, Bancolombia...) y paga <strong class="text-amber-300">${monto}</strong> ${d.qr && d.llave ? 'escaneando el QR o con la llave Bre-B:' : d.qr ? 'escaneando el QR.' : 'con la llave Bre-B:'}</p>
          ${d.llave ? `<div class="flex items-center gap-2">
            <code id="llaveBreB" class="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-white select-all">${escaparTextoPago(d.llave)}</code>
            <button type="button" id="btnCopiarLlave" class="btn-secundario text-[11px] px-3 py-2">Copiar</button>
          </div>` : ''}
          ${d.titular ? `<p class="text-white/60">A nombre de: <strong class="text-white">${escaparTextoPago(d.titular)}</strong></p>` : ''}
          <p class="text-white/70">2. Escribe el número del comprobante que te da tu banco:</p>
        </div>
      </div>
      <div>
        <label for="numeroComprobante" class="text-[11px] text-white/60 block mb-1">Número del comprobante</label>
        <input id="numeroComprobante" required maxlength="40" placeholder="Ej: M123456789" class="campo" autocomplete="off">
      </div>
      <p class="text-[11px] text-white/50">El pago queda <strong>por verificar</strong> hasta que el salón confirme que recibió el dinero.</p>`;
    ['btnAmpliarQR', 'btnVerQRGrande'].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => verQRGrande(d.qr));
    });
    const copiar = document.getElementById('btnCopiarLlave');
    if (copiar) copiar.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(d.llave); copiar.textContent = '¡Copiada!'; }
      catch (e) { window.getSelection().selectAllChildren(document.getElementById('llaveBreB')); copiar.textContent = 'Selecciónala'; }
      setTimeout(() => { copiar.textContent = 'Copiar'; }, 1500);
    });
  } else {
    if (btn) { btn.classList.remove('hidden'); btn.textContent = 'Pagar en el salón'; }
    cont.innerHTML = `
      <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
        Pagas en recepción (efectivo, datáfono o Bre-B) cuando termine tu servicio.
      </div>
    `;
  }
}

// Muestra el QR a pantalla completa para que el celular lo pueda leer desde el computador.
// Si la clienta está en el celular, mejor lo descarga y en su banco elige "pagar con QR desde la galería".
function verQRGrande(src) {
  let visor = document.getElementById('visorQRBreB');
  if (!visor) {
    visor = document.createElement('dialog');
    visor.id = 'visorQRBreB';
    // Colores fijos (no del tema): el QR siempre se lee mejor sobre blanco
    visor.style.cssText = 'padding:0;border:0;border-radius:1rem;background:#fff;max-width:95vw;max-height:95vh';
    visor.innerHTML = `<div style="padding:1rem;display:flex;flex-direction:column;align-items:center;gap:.75rem">
        <img id="imgVisorQR" alt="Código QR Bre-B del salón" style="display:block;width:min(85vw,78vh);height:min(85vw,78vh);object-fit:contain;background:#fff">
        <p style="margin:0;font-size:.875rem;color:#374151;text-align:center">Escanéalo con la app de tu banco. Acerca o aleja el celular hasta que enfoque.</p>
        <button type="button" style="padding:.5rem 1.25rem;border-radius:9999px;background:#111827;color:#fff;font-size:.875rem;font-weight:600;border:0;cursor:pointer">Cerrar</button>
      </div>`;
    visor.querySelector('button').addEventListener('click', () => visor.close());
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
    document.body.appendChild(visor);
  }
  visor.querySelector('#imgVisorQR').src = src;
  visor.showModal();
}

async function procesarTransaccionPago() {
  if (!citaEnProcesoPago) return;

  const btn = document.getElementById('btnConfirmarTransaccion');
  const alerta = document.getElementById('alertaPagoModal');
  const textoOriginal = btn ? btn.textContent : 'Confirmar';

  if (alerta) alerta.classList.add('hidden');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Guardando en MySQL...';
  }

  const idCitaReal = citaEnProcesoPago.id_cita || citaEnProcesoPago.id;
  const metodoFinal = metodoPagoSeleccionado === 'Salon' ? 'Efectivo / Salón' : 'Bre-B';
  const comprobante = document.getElementById('numeroComprobante')?.value.trim() || '';

  const resp = await pedir('/pagos', 'POST', {
    idCita: idCitaReal,
    metodo: metodoFinal,
    comprobante
  });

  if (btn) {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }

  if (!resp || resp.errorRed || !resp.success) {
    if (alerta) {
      alerta.textContent = (resp && (resp.message || resp.mensaje)) || 'No se pudo registrar el pago en el servidor.';
      alerta.classList.remove('hidden');
    }
    return;
  }

  const pagoGuardado = resp.data;
  if (pagoGuardado) {
    cachePagosPorCita[String(idCitaReal)] = pagoGuardado;
  }

  cerrarModalPago();

  if (typeof callbackPagoCompletado === 'function') {
    await callbackPagoCompletado(pagoGuardado);
  }

  await verComprobantePago(idCitaReal);
}

window.verComprobantePago = async function(idCita) {
  inyectarModalesPago();

  let pago = obtenerPagoPorCita(idCita);
  if (!pago) {
    const resp = await pedir(`/pagos/cita/${idCita}`, 'GET').catch(() => null);
    if (resp && resp.success && resp.data) {
      pago = resp.data;
      cachePagosPorCita[String(idCita)] = pago;
    }
  }
  if (!pago) return;

  const cont = document.getElementById('contenidoComprobante');
  if (!cont) return;

  const pagado = pago.estado === 'Pagado';

  cont.innerHTML = `
    <div class="text-center space-y-1 pb-3 border-b border-white/10">
      <h4 class="font-serif text-xl font-bold text-white">Bella<span class="text-pink-400">Style</span></h4>
      <p class="text-[11px] text-white/50">Comprobante Electrónico de Servicio</p>
      <span class="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
        pagado ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : pago.estado === 'Rechazado' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }">${escaparTextoPago(pago.estado)}</span>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between"><span class="text-white/50">Referencia:</span><strong class="font-mono text-pink-300">${escaparTextoPago(pago.referencia)}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Fecha de Pago:</span><span class="text-white">${escaparTextoPago(pago.fecha_pago)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Clienta:</span><span class="text-white font-semibold">${escaparTextoPago(pago.cliente)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Servicio:</span><span class="text-white">${escaparTextoPago(pago.servicio)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Especialista:</span><span class="text-white">${escaparTextoPago(pago.estilista)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Método de Pago:</span><span class="text-white font-semibold">${escaparTextoPago(pago.metodo)}</span></div>
      ${pago.comprobante ? `<div class="flex justify-between"><span class="text-white/50">Comprobante Bre-B:</span><span class="font-mono text-white">${escaparTextoPago(pago.comprobante)}</span></div>` : ''}
    </div>

    <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
      <span class="text-white/70 font-semibold">Valor Total</span>
      <strong class="text-xl font-serif text-amber-300">${formatearMonedaPago(pago.monto)}</strong>
    </div>
  `;

  const modal = document.getElementById('modalComprobantePago');
  if (modal && !modal.open) modal.showModal();
};