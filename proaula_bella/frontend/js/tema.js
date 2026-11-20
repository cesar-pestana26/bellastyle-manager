// js/tema.js - Control global de tema (Claro/Oscuro) y reproducción de fondo

const ICONO_LUNA = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICONO_SOL = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

function temaGuardado() {
  try { return localStorage.getItem('tema'); } catch (e) { return 'oscuro'; }
}

function aplicarTema(tema) {
  const esOscuro = tema === 'oscuro';
  document.documentElement.classList.toggle('oscuro', esOscuro);
  document.documentElement.classList.toggle('dark', esOscuro);
}

// 1) Aplicación inmediata antes de renderizar para evitar parpadeos
// Las páginas están diseñadas en modo oscuro: en modo claro el texto blanco no se leía.
aplicarTema('oscuro');

// 2) Eventos de carga del DOM
document.addEventListener('DOMContentLoaded', () => {
  // Solo hay modo oscuro: se ocultan los botones de cambiar tema
  document.querySelectorAll('.btn-toggle-tema').forEach(btn => { btn.style.display = 'none'; });

  crearVideoDeFondo();
});

function alternarTema() {
  const esOscuro = document.documentElement.classList.contains('oscuro');
  const nuevoTema = esOscuro ? 'claro' : 'oscuro';
  
  aplicarTema(nuevoTema);
  try { localStorage.setItem('tema', nuevoTema); } catch (e) {}

  document.querySelectorAll('.btn-toggle-tema, .btn-tema-flotante').forEach(actualizarEstiloBoton);
  pausarVideoSegunTema();
}

function actualizarEstiloBoton(btn) {
  if (!btn) return;
  const oscuro = document.documentElement.classList.contains('oscuro');
  btn.innerHTML = oscuro 
    ? `${ICONO_SOL} <span>Modo claro</span>` 
    : `${ICONO_LUNA} <span>Modo oscuro</span>`;
  btn.title = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  btn.setAttribute('aria-label', btn.title);
}

function htmlVideo(clase, nombre) {
  return `<div class="fondo-video ${clase}" aria-hidden="true">
    <video muted loop playsinline preload="none" poster="img/${nombre}.webp">
      <source src="img/${nombre}.webm" type="video/webm">
      <source src="img/${nombre}.mp4" type="video/mp4">
    </video>
  </div>`;
}

function crearVideoDeFondo() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.body.hasAttribute('data-sin-video')) return;

  const destino = document.getElementById('ladoVideo') || document.body;
  if (destino.id === 'ladoVideo' && getComputedStyle(destino).display === 'none') return;

  // Evita duplicar elementos si ya fueron creados previamente
  if (destino.querySelector('.fondo-video')) return;

  destino.insertAdjacentHTML('afterbegin',
    htmlVideo('fondo-video-claro', 'fondo') + htmlVideo('fondo-video-oscuro', 'fondo-oscuro')
  );
  pausarVideoSegunTema();
}

function pausarVideoSegunTema() {
  const oscuro = document.documentElement.classList.contains('oscuro');
  const activo = document.querySelector(oscuro ? '.fondo-video-oscuro video' : '.fondo-video-claro video');
  const otro = document.querySelector(oscuro ? '.fondo-video-claro video' : '.fondo-video-oscuro video');

  if (otro) otro.pause();
  if (activo) {
    activo.preload = 'auto';
    activo.play().catch(() => {});
  }
}