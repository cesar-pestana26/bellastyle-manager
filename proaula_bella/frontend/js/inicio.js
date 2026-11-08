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

// 3. Vitrina: fotos que suben la administradora y las estilistas desde su panel
async function cargarVitrina() {
    const respuesta = await pedir('/vitrina');
    const fotos = respuesta.success ? respuesta.data : [];
    const galeria = document.getElementById('galeriaVitrina');
    if (fotos.length === 0) {
        // Sin fotos todavía: un mensaje en vez de un espacio vacío
        galeria.outerHTML = `<div class="mt-10 rounded-2xl border-2 border-dashed border-bella-200 px-6 py-12 text-center">
            <p class="font-titulo text-2xl font-bold">Muy pronto</p>
            <p class="mt-1 text-sm text-tinta/75">Aquí verás fotos del salón y de los trabajos de nuestras estilistas.</p>
        </div>`;
        return;
    }
    galeria.innerHTML = fotos.map((f) => {
        const quien = f.rol === 'Administradora' ? 'BellaStyle' : f.autor;
        const texto = (f.descripcion ? f.descripcion + ' · ' : '') + quien;
        return `
            <button type="button" data-ver="${f.url}" data-texto="${escapar(texto).replace(/"/g, '&quot;')}"
                class="group relative block w-full overflow-hidden rounded-2xl bg-tinta/5 shadow-sm break-inside-avoid">
                <img src="${f.url}" alt="${escapar(f.descripcion || 'Trabajo de ' + quien)}" loading="lazy" class="w-full transition duration-500 group-hover:scale-105">
                <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-10 text-left text-xs font-medium text-white">${escapar(texto)}</span>
            </button>`;
    }).join('');

    const visor = document.getElementById('visorFoto');
    galeria.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => {
        document.getElementById('visorImagen').src = b.dataset.ver;
        document.getElementById('visorTexto').textContent = b.dataset.texto;
        visor.showModal();
    }));
    visor.addEventListener('click', () => visor.close());
}

cargarVitrina();

// 4. Productos con su foto (la sube la administradora desde Productos -> Foto)
async function cargarProductos() {
    const respuesta = await pedir('/productos');
    const lista = document.getElementById('listaProductos');
    const productos = respuesta.success ? respuesta.data : [];
    if (productos.length === 0) {
        document.getElementById('productos').classList.add('hidden');
        return;
    }
    lista.innerHTML = productos.map((p) => `
        <article class="tarjeta overflow-hidden">
            <div class="aspect-square overflow-hidden bg-tinta/5">
                <img src="/api/productos/${p.id_producto}/foto" alt="${escapar(p.nombre)}" loading="lazy" class="h-full w-full object-cover transition duration-500 hover:scale-105">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold leading-tight">${escapar(p.nombre)}</h3>
                <p class="mt-1 font-titulo text-2xl font-bold text-oro">${pesos(p.precio)}</p>
                ${p.stock > 0 ? '' : '<p class="text-xs font-semibold text-red-700">Agotado</p>'}
            </div>
        </article>`).join('');
}

cargarProductos();
