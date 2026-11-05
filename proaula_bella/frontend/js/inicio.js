// Página de inicio (welcome.html): animaciones y datos desde la API

// 1. El menú se vuelve opaco cuando se baja en la página
const menu = document.getElementById('menu');
window.addEventListener('scroll', () => {
    const abajo = window.scrollY > 40;
    menu.classList.toggle('bg-noche-950/80', abajo);
    menu.classList.toggle('backdrop-blur', abajo);
    menu.classList.toggle('border-tinta/5', abajo);
});

// 2. Los elementos con clase "revelar" aparecen cuando entran en pantalla.
//    IntersectionObserver avisa cuando un elemento se vuelve visible.
const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            const el = entrada.target;
            el.classList.add('visible');
            observador.unobserve(el);
            // Terminada la entrada, el efecto hover responde rápido y sin retraso
            setTimeout(() => {
                el.style.transitionDelay = '0ms';
                el.style.transitionDuration = '300ms';
            }, 1200);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));
