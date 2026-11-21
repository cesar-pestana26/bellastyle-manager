// js/ojoPassword.js - Pone un ojito dentro de cada campo de contraseña de la página.
// Al tocarlo se ve lo que se escribió; al tocarlo otra vez se vuelve a ocultar.
(function () {
  const OJO = '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const OJO_TACHADO = '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/></svg>';

  function ponerOjo(input) {
    if (input.dataset.ojo) return;
    input.dataset.ojo = '1';
    const caja = document.createElement('div');
    caja.className = 'relative';
    input.parentNode.insertBefore(caja, input);
    caja.appendChild(input);
    input.style.paddingRight = '3rem';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/60 hover:text-pink-400 transition';
    boton.setAttribute('aria-label', 'Mostrar contraseña');
    boton.innerHTML = OJO;
    boton.addEventListener('click', () => {
      const oculta = input.type === 'password';
      input.type = oculta ? 'text' : 'password';
      boton.innerHTML = oculta ? OJO_TACHADO : OJO;
      boton.setAttribute('aria-label', oculta ? 'Ocultar contraseña' : 'Mostrar contraseña');
      input.focus();
    });
    caja.appendChild(boton);
  }

  function iniciar() { document.querySelectorAll('input[type="password"]').forEach(ponerOjo); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
