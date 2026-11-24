// js/pwa.js - Convierte BellaStyle en aplicación instalable (PWA).
// 1. Registra el service worker (sw.js) para que la app abra rápido y avise si no hay internet.
// 2. Cuando el navegador permite instalar, muestra los botones "Instalar app"
//    (los que tienen data-instalar-app y una opción en el menú del perfil de los paneles).
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker no registrado:', e.message));
    });
  }

  let aviso = null;   // evento beforeinstallprompt guardado para usarlo al tocar el botón

  function instalar() {
    if (!aviso) return;
    aviso.prompt();
    aviso.userChoice.finally(() => { aviso = null; mostrar(false); });
  }

  function mostrar(si) {
    document.querySelectorAll('[data-instalar-app]').forEach((b) => b.classList.toggle('hidden', !si));
  }

  function prepararBotones() {
    // Opción en el menú del nombre de los paneles (clienta, estilista y administradora)
    document.querySelectorAll('.menu-perfil-lista').forEach((lista) => {
      if (lista.querySelector('[data-instalar-app]')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.instalarApp = '';
      b.className = 'hidden w-full text-left px-3 py-2 text-xs text-pink-300 hover:bg-white/10 rounded-lg transition font-semibold';
      b.textContent = 'Instalar la app';
      lista.insertBefore(b, lista.firstChild);
    });
    document.querySelectorAll('[data-instalar-app]').forEach((b) => {
      if (!b.dataset.listo) { b.dataset.listo = '1'; b.addEventListener('click', instalar); }
    });
    mostrar(Boolean(aviso));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    aviso = e;
    prepararBotones();
  });
  window.addEventListener('appinstalled', () => { aviso = null; mostrar(false); });
  document.addEventListener('DOMContentLoaded', prepararBotones);
})();
