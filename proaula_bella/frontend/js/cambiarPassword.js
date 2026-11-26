(function () {
  const listas = document.querySelectorAll('.menu-perfil-lista');
  if (!listas.length) return;

  const ventana = document.createElement('dialog');
  ventana.id = 'ventanaCambiarPassword';
  ventana.className = 'max-w-md w-full rounded-2xl bg-[#120f1d] p-6 text-white border border-white/20 backdrop:bg-black/80 shadow-2xl';
  ventana.innerHTML = `
    <form id="formCambiarPassword" class="space-y-4" novalidate>
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-serif text-xl font-bold text-white">Cambiar contraseña</h3>
          <p class="mt-1 text-xs text-white/60">Usa al menos 6 caracteres. Mejor si mezclas letras, números y un símbolo.</p>
        </div>
        <button type="button" data-cerrar class="text-white/60 hover:text-white text-lg leading-none" aria-label="Cerrar">×</button>
      </div>
      <div id="alertaCambiarPassword" class="hidden rounded-xl px-3 py-2 text-xs font-semibold"></div>
      <label class="block text-xs font-semibold text-white/70">Contraseña actual
        <input id="passwordActual" type="password" class="campo mt-1" autocomplete="current-password" required>
      </label>
      <label class="block text-xs font-semibold text-white/70">Contraseña nueva
        <input id="passwordNueva" type="password" class="campo mt-1" autocomplete="new-password" minlength="6" required>
      </label>
      <label class="block text-xs font-semibold text-white/70">Repite la contraseña nueva
        <input id="passwordNueva2" type="password" class="campo mt-1" autocomplete="new-password" minlength="6" required>
      </label>
      <label class="block text-xs font-semibold text-white/70">Teléfono para recuperarla (opcional)
        <input id="telefonoRecuperacion" type="tel" inputmode="numeric" maxlength="10" class="campo mt-1" placeholder="3001234567">
      </label>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" data-cerrar class="btn-secundario text-sm">Cancelar</button>
        <button type="submit" id="btnGuardarPassword" class="btn-primario text-sm">Guardar</button>
      </div>
    </form>`;
  document.body.appendChild(ventana);

  const form = ventana.querySelector('form');
  const alerta = ventana.querySelector('#alertaCambiarPassword');
  const tel = ventana.querySelector('#telefonoRecuperacion');
  tel.addEventListener('input', () => { tel.value = tel.value.replace(/\D/g, ''); });

  function avisar(texto, ok) {
    alerta.textContent = texto;
    alerta.className = 'rounded-xl px-3 py-2 text-xs font-semibold ' +
      (ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30');
  }
  function abrir() {
    form.reset();
    alerta.className = 'hidden';
    ventana.showModal();
    ventana.querySelector('#passwordActual').focus();
  }
  ventana.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => ventana.close()));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const actual = ventana.querySelector('#passwordActual').value;
    const nueva = ventana.querySelector('#passwordNueva').value;
    const nueva2 = ventana.querySelector('#passwordNueva2').value;
    const telefono = tel.value.trim();
    if (!actual || nueva.length < 6) return avisar('Escribe tu contraseña actual y una nueva de al menos 6 caracteres.');
    if (nueva !== nueva2) return avisar('Las dos contraseñas nuevas no son iguales.');
    if (telefono && !/^\d{10}$/.test(telefono)) return avisar('El teléfono debe tener 10 dígitos.');
    const boton = ventana.querySelector('#btnGuardarPassword');
    boton.disabled = true;
    const r = await pedir('/mi-cuenta/password', 'PUT', telefono ? { actual, nueva, telefono } : { actual, nueva });
    boton.disabled = false;
    if (!r.success) return avisar(r.message || 'No se pudo cambiar la contraseña.');
    avisar(r.message, true);
    setTimeout(() => ventana.close(), 1600);
  });

  listas.forEach((lista) => {
    const opcion = document.createElement('button');
    opcion.type = 'button';
    opcion.className = 'w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 rounded-lg transition';
    opcion.textContent = 'Cambiar contraseña';
    opcion.addEventListener('click', abrir);
    const separador = lista.querySelector('.border-t');
    if (separador) lista.insertBefore(opcion, separador); else lista.appendChild(opcion);
  });
})();
