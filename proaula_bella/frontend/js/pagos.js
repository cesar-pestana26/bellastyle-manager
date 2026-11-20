// js/pagos.js - Pasarela de Pagos y Comprobantes conectada 100% a MySQL (/api/pagos)

let citaEnProcesoPago = null;
let metodoPagoSeleccionado = 'Nequi';
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
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" id="selectorMetodosPago">
          <button type="button" onclick="seleccionarMetodoPago('Nequi')" data-metodo="Nequi"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-pink-400 bg-pink-500/20 text-white font-bold flex items-center justify-center gap-1.5 transition">
            ${ico('celular')}
            <span>Nequi / Davi</span>
          </button>
          <button type="button" onclick="seleccionarMetodoPago('Tarjeta')" data-metodo="Tarjeta"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition">
            ${ico('tarjeta')}
            <span>Tarjeta</span>
          </button>
          <button type="button" onclick="seleccionarMetodoPago('PSE')" data-metodo="PSE"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition">
            ${ico('banco')}
            <span>PSE</span>
          </button>
          <button type="button" onclick="seleccionarMetodoPago('Salon')" data-metodo="Salon"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition">
            ${ico('salon')}
            <span>En Salón</span>
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
  renderizarCamposMetodoPago('Nequi');

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

  seleccionarMetodoPago('Nequi');

  const modal = document.getElementById('modalPasarelaPago');
  if (modal && !modal.open) modal.showModal();
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

  if (metodo === 'Nequi') {
    if (btn) btn.textContent = 'Pagar con Billetera Digital';
    cont.innerHTML = `
      <div>
        <label class="text-[11px] text-white/60 block mb-1">Número de celular Nequi / Daviplata</label>
        <input type="tel" required placeholder="300 000 0000" maxlength="10" class="campo">
      </div>
      <p class="text-[11px] text-white/50">Recibirás una notificación push en tu celular para autorizar el débito.</p>
    `;
  } else if (metodo === 'Tarjeta') {
    if (btn) btn.textContent = 'Pagar con Tarjeta';
    cont.innerHTML = `
      <div>
        <label class="text-[11px] text-white/60 block mb-1">Número de Tarjeta</label>
        <input type="text" required placeholder="4532 •••• •••• 8890" maxlength="19" class="campo">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[11px] text-white/60 block mb-1">Vencimiento</label>
          <input type="text" required placeholder="MM/AA" maxlength="5" class="campo">
        </div>
        <div>
          <label class="text-[11px] text-white/60 block mb-1">CVV</label>
          <input type="password" required placeholder="123" maxlength="4" class="campo">
        </div>
      </div>
    `;
  } else if (metodo === 'PSE') {
    if (btn) btn.textContent = 'Continuar a PSE';
    cont.innerHTML = `
      <div>
        <label class="text-[11px] text-white/60 block mb-1">Selecciona tu Banco</label>
        <select required class="campo bg-[#120f1d]">
          <option value="Bancolombia">Bancolombia</option>
          <option value="Davivienda">Davivienda</option>
          <option value="Banco de Bogotá">Banco de Bogotá</option>
          <option value="BBVA">BBVA Colombia</option>
        </select>
      </div>
      <div>
        <label class="text-[11px] text-white/60 block mb-1">Documento de Identidad</label>
        <input type="text" required placeholder="Número de cédula" class="campo">
      </div>
    `;
  } else {
    if (btn) btn.textContent = 'Registrar Pago en Salón';
    cont.innerHTML = `
      <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
        Tu cita quedará marcada para pago presencial en recepción (efectivo o datáfono) al finalizar tu atención.
      </div>
    `;
  }
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
  const metodoFinal = metodoPagoSeleccionado === 'Salon' ? 'Efectivo / Salón' : metodoPagoSeleccionado;

  const resp = await pedir('/pagos', 'POST', {
    idCita: idCitaReal,
    metodo: metodoFinal
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
        pagado ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }">${escaparTextoPago(pago.estado)}</span>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between"><span class="text-white/50">Referencia:</span><strong class="font-mono text-pink-300">${escaparTextoPago(pago.referencia)}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Fecha de Pago:</span><span class="text-white">${escaparTextoPago(pago.fecha_pago)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Clienta:</span><span class="text-white font-semibold">${escaparTextoPago(pago.cliente)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Servicio:</span><span class="text-white">${escaparTextoPago(pago.servicio)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Especialista:</span><span class="text-white">${escaparTextoPago(pago.estilista)}</span></div>
      <div class="flex justify-between"><span class="text-white/50">Método de Pago:</span><span class="text-white font-semibold">${escaparTextoPago(pago.metodo)}</span></div>
    </div>

    <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
      <span class="text-white/70 font-semibold">Valor Total</span>
      <strong class="text-xl font-serif text-amber-300">${formatearMonedaPago(pago.monto)}</strong>
    </div>
  `;

  const modal = document.getElementById('modalComprobantePago');
  if (modal && !modal.open) modal.showModal();
};