// js/menuPerfil.js - Menú de la foto y el nombre (paneles).
// Antes se abría al pasar el mouse y se cerraba al bajar hacia las opciones.
// Ahora se abre y se cierra con un clic (también funciona en celular)
// y se cierra al hacer clic afuera, al elegir una opción o con la tecla Esc.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.menu-perfil').forEach((menu) => {
    const boton = menu.querySelector('.menu-perfil-boton');
    const lista = menu.querySelector('.menu-perfil-lista');
    if (!boton || !lista) return;
    const abrir = (si) => {
      lista.classList.toggle('hidden', !si);
      boton.setAttribute('aria-expanded', String(si));
    };
    boton.addEventListener('click', (e) => { e.stopPropagation(); abrir(lista.classList.contains('hidden')); });
    lista.addEventListener('click', (e) => { if (e.target.closest('a, button')) abrir(false); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) abrir(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });
  });
});
