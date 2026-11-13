// js/pagos.js - Pasarela de Pagos, Comprobantes y Control de Caja (COP)

let citaEnProcesoPago = null;
let metodoPagoSeleccionado = 'Nequi';
let callbackPagoExitoso = null;

document.addEventListener('DOMContentLoaded', () => {
  inyectarModalesPago();
});

/**
 * Inyecta los modales de Pasarela y Comprobante en el DOM automáticamente
 */
function inyectarModalesPago() {
  if (document.getElementById('modalPasarelaPago')) return;

  const htmlModales = `
    <!-- MODAL PASARELA DE PAGO -->
    <dialog id="modalPasarelaPago" class="max-w-lg w-full rounded-2xl bg-[#120f1d] p-6 text-white border border-white/20 backdrop:bg-black/80 shadow-2xl">
      <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-pink-400 font-bold">Checkout Seguro · BellaStyle</span>
          <h3 class="font-serif font-bold text-lg text-white">Completar Pago de Servicio</h3>
        </div>
        <button type="button" onclick="cerrarPasarelaPago()" class="text-white/50 hover:text-white text-xl font-bold">&times;</button>
      </div>

      <!-- Resumen del Cobro -->
      <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4 flex items-center justify-between text-xs">
        <div>
          <p class="font-bold text-white text-sm" id="pagoResumenServicio">Servicio</p>
          <p class="text-white/60 mt-0.5" id="pagoResumenDetalle">Estilista · Fecha</p>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-white/50 block uppercase">Total a Pagar</span>
          <strong class="text-lg font-serif text-amber-300" id="pagoResumenMonto">$0</strong>
        </div>
      </div>

      <!-- Selector de Método de Pago -->
      <div class="mb-4">
        <label class="text-[11px] uppercase tracking-wider text-white/60 font-semibold block mb-2">Selecciona método de pago</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" id="selectorMetodosPago">
          <button type="button" onclick="seleccionarMetodoPago('Nequi')" data-metodo="Nequi"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-pink-400 bg-pink-500/20 text-white font-bold text-center transition">
            📱 Nequi / Davi
          </button>
          <button type="button" onclick="seleccionarMetodoPago('Tarjeta')" data-metodo="Tarjeta"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold text-center transition">
            💳 Tarjeta
          </button>
          <button type="button" onclick="seleccionarMetodoPago('PSE')" data-metodo="PSE"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold text-center transition">
            🏦 PSE
          </button>
          <button type="button" onclick="seleccionarMetodoPago('Salon')" data-metodo="Salon"
            class="btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold text-center transition">
            🏪 En Salón
          </button>
        </div>
      </div>

      <!-- Formulario Dinámico según Método -->
      <form id="formPasarelaPago" class="space-y-4">
        <div id="camposMetodoPago" class="space-y-3 text-xs"></div>

        <div id="alertaPasarelaPago" class="hidden p-2.5 rounded-xl text-xs font-semibold"></div>

        <div class="flex justify-end gap-2 pt-4 border-t border-white/10">
          <button type="button" onclick="cerrarPasarelaPago()" class="btn-secundario text-xs px-4 py-2">Cancelar</button>
          <button type="submit" id="btnConfirmarTransaccion" class="btn-primario text-xs px-5 py-2.5 font-bold">
            Confirmar Pago
          </button>
        </div>
      </form>
    </dialog>

    <!-- MODAL COMPROBANTE DIGITAL -->
    <dialog id="modalComprobantePago" class="max-w-md w-full rounded-2xl bg-[#120f1d] p-6 text-white border border-white/20 backdrop:bg-black/80 shadow-2xl">
      <div id="contenidoComprobante" class="space-y-4 text-xs"></div>
      <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-white/10">
        <button type="button" onclick="window.print()" class="btn-secundario text-xs px-4 py-2">🖨️ Imprimir</button>
        <button type="button" onclick="document.getElementById('modalComprobantePago').close()" class="btn-primario text-xs px-5 py-2">Cerrar</button>
      </div>
    </dialog>
  `;

  document.body.insertAdjacentHTML('beforeend', htmlModales);

  document.getElementById('formPasarelaPago').addEventListener('submit', procesarTransaccionPago);
}

/**
 * Abre la pasarela de pago para una cita específica
 */
window.abrirPasarelaPago = function(cita, onSuccess = null) {
  inyectarModalesPago();
  citaEnProcesoPago = cita;
  callbackPagoExitoso = onSuccess;

  const monto = Number(cita.valor) || Number(cita.precio) || 0;
  const fmt = (n) => typeof pesos === 'function' ? pesos(n) : '$' + n.toLocaleString('es-CO');

  document.getElementById('pagoResumenServicio').textContent = cita.servicio;
  document.getElementById('pagoResumenDetalle').textContent = `${cita.estilista} · ${cita.fecha} (${cita.hora})`;
  document.getElementById('pagoResumenMonto').textContent = fmt(monto);

  const alerta = document.getElementById('alertaPasarelaPago');
  if (alerta) alerta.classList.add('hidden');

  seleccionarMetodoPago('Nequi');

  const modal = document.getElementById('modalPasarelaPago');
  if (modal && !modal.open) modal.showModal();
};

window.cerrarPasarelaPago = function() {
  const modal = document.getElementById('modalPasarelaPago');
  if (modal) modal.close();
};

window.seleccionarMetodoPago = function(metodo) {
  metodoPagoSeleccionado = metodo;

  document.querySelectorAll('.btn-metodo-pago').forEach(btn => {
    const activo = btn.dataset.metodo === metodo;
    btn.className = activo
      ? 'btn-metodo-pago py-2.5 px-2 rounded-xl border border-pink-400 bg-pink-500/20 text-white font-bold text-center transition'
      : 'btn-metodo-pago py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white font-semibold text-center transition';
  });

  const contenedor = document.getElementById('camposMetodoPago');
  const btnSubmit = document.getElementById('btnConfirmarTransaccion');

  if (metodo === 'Nequi') {
    btnSubmit.textContent = 'Validar Transferencia';
    contenedor.innerHTML = `
      <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-200 space-y-1">
        <p class="font-bold">📲 Transferencia Nequi / Daviplata BellaStyle</p>
        <p>Número oficial del salón: <strong class="text-white select-all">300 555 0192</strong></p>
      </div>
      <div>
        <label class="text-white/70 block mb-1">Tu número celular desde donde transfieres</label>
        <input id="pagoCelular" type="tel" maxlength="10" placeholder="Ej: 3104567890" class="campo" required>
      </div>
      <div>
        <label class="text-white/70 block mb-1">Número de comprobante / referencia</label>
        <input id="pagoReferencia" type="text" placeholder="Ej: M123456" class="campo" required>
      </div>
    `;
  } else if (metodo === 'Tarjeta') {
    btnSubmit.textContent = 'Pagar con Tarjeta';
    contenedor.innerHTML = `
      <div>
        <label class="text-white/70 block mb-1">Nombre en la tarjeta</label>
        <input id="pagoTitular" type="text" placeholder="Como aparece en el plástico" class="campo" required>
      </div>
      <div>
        <label class="text-white/70 block mb-1">Número de tarjeta</label>
        <input id="pagoNumeroTarjeta" type="text" maxlength="19" placeholder="4532 •••• •••• 8890" class="campo font-mono" required>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-white/70 block mb-1">Vencimiento (MM/AA)</label>
          <input id="pagoExp" type="text" maxlength="5" placeholder="08/29" class="campo text-center" required>
        </div>
        <div>
          <label class="text-white/70 block mb-1">Código CVV</label>
          <input id="pagoCvv" type="password" maxlength="4" placeholder="•••" class="campo text-center" required>
        </div>
      </div>
    `;
  } else if (metodo === 'PSE') {
    btnSubmit.textContent = 'Continuar a PSE';
    contenedor.innerHTML = `
      <div>
        <label class="text-white/70 block mb-1">Selecciona tu Banco</label>
        <select id="pagoBanco" class="campo bg-[#120f1d]" required>
          <option value="Bancolombia">Bancolombia</option>
          <option value="Davivienda">Davivienda</option>
          <option value="Banco de Bogotá">Banco de Bogotá</option>
          <option value="Nequi">Nequi</option>
          <option value="Nu Colombia">Nu Colombia</option>
        </select>
      </div>
      <div>
        <label class="text-white/70 block mb-1">Cédula de Ciudadanía (Titular)</label>
        <input id="pagoCedula" type="number" placeholder="Ej: 1047456123" class="campo" required>
      </div>
    `;
  } else if (metodo === 'Salon') {
    btnSubmit.textContent = 'Confirmar Pago en Recepción';
    contenedor.innerHTML = `
      <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-1.5">
        <p class="font-bold">🏪 Pago Presencial en el Salón</p>
        <p>Tu cita quedará reservada y podrás cancelar el valor en recepción al finalizar tu servicio mediante <strong>Efectivo, Datáfono o QR</strong>.</p>
      </div>
    `;
  }
};

async function procesarTransaccionPago(e) {
  e.preventDefault();
  if (!citaEnProcesoPago) return;

  const btn = document.getElementById('btnConfirmarTransaccion');
  const alerta = document.getElementById('alertaPasarelaPago');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  const esPagoEnSalon = metodoPagoSeleccionado === 'Salon';
  const monto = Number(citaEnProcesoPago.valor) || Number(citaEnProcesoPago.precio) || 0;
  const codigoTx = 'TXN-' + Date.now().toString().slice(-6);

  const registroPago = {
    id_pago: codigoTx,
    id_cita: citaEnProcesoPago.id,
    cliente: citaEnProcesoPago.cliente || 'Clienta',
    servicio: citaEnProcesoPago.servicio,
    estilista: citaEnProcesoPago.estilista,
    monto: monto,
    metodo: esPagoEnSalon ? 'Efectivo / Salón' : metodoPagoSeleccionado,
    referencia: document.getElementById('pagoReferencia')?.value.trim() || codigoTx,
    estado_pago: esPagoEnSalon ? 'Pendiente en Salón' : 'Pagado',
    fecha_pago: new Date().toISOString().slice(0, 10)
  };

  try {
    if (typeof pedir === 'function') {
      await pedir('/pagos', 'POST', registroPago).catch(() => null);
    }
  } catch (err) {}

  // Guardar en historial local de pagos
  guardarPagoLocal(registroPago);

  alerta.textContent = esPagoEnSalon
    ? '¡Reserva registrada con pago en salón!'
    : `¡Pago aprobado! Comprobante ${codigoTx}`;
  alerta.className = 'p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold block';
  alerta.classList.remove('hidden');

  setTimeout(() => {
    btn.disabled = false;
    cerrarPasarelaPago();
    if (typeof callbackPagoExitoso === 'function') {
      callbackPagoExitoso(registroPago);
    }
    if (!esPagoEnSalon) {
      verComprobantePago(registroPago.id_cita);
    }
  }, 900);
}

function guardarPagoLocal(pago) {
  try {
    const lista = JSON.parse(localStorage.getItem('pagosBellaStyle')) || [];
    const idx = lista.findIndex(p => String(p.id_cita) === String(pago.id_cita));
    if (idx !== -1) lista[idx] = pago;
    else lista.unshift(pago);
    localStorage.setItem('pagosBellaStyle', JSON.stringify(lista));
  } catch (e) {}
}

window.obtenerPagosLocales = function() {
  try {
    return JSON.parse(localStorage.getItem('pagosBellaStyle')) || [];
  } catch (e) {
    return [];
  }
};

window.obtenerPagoPorCita = function(idCita) {
  return obtenerPagosLocales().find(p => String(p.id_cita) === String(idCita)) || null;
};

/**
 * Abre el modal con el recibo digital de una cita pagada
 */
window.verComprobantePago = function(idCita) {
  inyectarModalesPago();
  const pago = obtenerPagoPorCita(idCita);
  if (!pago) return;

  const fmt = (n) => typeof pesos === 'function' ? pesos(n) : '$' + Number(n).toLocaleString('es-CO');

  document.getElementById('contenidoComprobante').innerHTML = `
    <div class="text-center border-b border-white/10 pb-4">
      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        ${pago.estado_pago}
      </span>
      <h3 class="font-serif text-xl font-bold text-white mt-2">BellaStyle Salón</h3>
      <p class="text-white/50 text-[11px]">Comprobante Electrónico de Servicio</p>
    </div>

    <div class="space-y-2 py-2">
      <div class="flex justify-between"><span class="text-white/50">Transacción:</span> <strong class="font-mono text-pink-300">${pago.id_pago}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Fecha de Pago:</span> <strong class="text-white">${pago.fecha_pago}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Clienta:</span> <strong class="text-white">${pago.cliente}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Servicio:</span> <strong class="text-white">${pago.servicio}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Estilista:</span> <strong class="text-white">${pago.estilista}</strong></div>
      <div class="flex justify-between"><span class="text-white/50">Método:</span> <strong class="text-white">${pago.metodo}</strong></div>
    </div>

    <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
      <span class="font-bold text-white/80 uppercase text-[11px]">Total Pagado</span>
      <strong class="text-lg font-serif text-emerald-300">${fmt(pago.monto)}</strong>
    </div>
  `;

  const modal = document.getElementById('modalComprobantePago');
  if (modal && !modal.open) modal.showModal();
};