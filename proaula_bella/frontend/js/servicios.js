// Menú de servicios con fotos (index.html y welcome.html).
// Se dibuja en cualquier elemento con el atributo data-menu-servicios.
// Arriba van los botones de cada servicio; al tocar uno se muestran
// sus fotos, precio, duración y una descripción.

// Fotos de cada servicio: las sube la administradora desde su panel
// (Servicios -> botón "Fotos") y se guardan en la base de datos.
// Se llenan al cargar la página: { idServicio: ['/api/fotos/3', ...] }
// Si un servicio no tiene fotos, se muestra una imagen de muestra con su ícono.
let fotosPorServicio = {};

// Descripción corta de cada servicio (si no está, se usa una general)
const DESCRIPCIONES = {
    'corte-de-cabello': 'Corte a tu medida según la forma de tu rostro y tu tipo de cabello. Incluye lavado y secado.',
    'tinte-coloracion': 'Color uniforme y duradero con productos que cuidan tu cabello. Te asesoramos para elegir el tono ideal.',
    'mechas-balayage': 'Luces naturales hechas a mano para un efecto degradado y luminoso.',
    'peinado-para-evento': 'Recogidos, ondas y peinados especiales para bodas, grados, quinceañeros y fiestas.',
    'manicure': 'Limpieza, forma y esmaltado de uñas de las manos, con hidratación de cutículas.',
    'pedicure': 'Cuidado completo de pies: limpieza, exfoliación, forma de uñas y esmaltado.',
    'tratamiento-capilar': 'Hidratación profunda y nutrición para cabello seco, maltratado o con frizz.'
};

// Íconos de muestra (mismo estilo de líneas que el resto de la app)
const ICONOS_SERVICIOS = {
    'corte-de-cabello': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    'tinte-coloracion': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    'mechas-balayage': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    'peinado-para-evento': '<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
    'manicure': '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    'pedicure': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0z"/>',
    'tratamiento-capilar': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
};
const ICONO_GENERAL = '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>';

// Fondos de las imágenes de muestra (se alternan)
const DEGRADADOS = [
    'from-bella-200 to-lavanda-200',
    'from-lavanda-200 to-bella-100',
    'from-bella-100 to-bella-300'
];

function claveServicio(nombre) {
    return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function iconoServicio(clave, clases) {
    return `<svg class="${clases}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS_SERVICIOS[clave] || ICONO_GENERAL}</svg>`;
}

// Galería. Con fotos: una grande y debajo las miniaturas (al tocar una, se agranda).
// Sin fotos: 3 imágenes de muestra con el ícono del servicio.
function galeria(servicio, clave) {
    const fotos = fotosPorServicio[servicio.id_servicio] || [];
    if (fotos.length === 0) {
        const muestra = (i, grande) => `
            <div class="${grande ? 'col-span-2 row-span-2' : ''} grid aspect-square place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${DEGRADADOS[i % 3]} text-bella-700">
                ${iconoServicio(clave, grande ? 'h-20 w-20 opacity-80' : 'h-10 w-10 opacity-70')}
            </div>`;
        return `<div class="grid grid-cols-3 grid-rows-2 gap-3">${muestra(0, true)}${muestra(1)}${muestra(2)}</div>`;
    }
    const miniaturas = fotos.length < 2 ? '' : `
        <div class="mt-3 grid grid-cols-6 gap-2">
            ${fotos.map((url, i) => `
                <button type="button" data-miniatura="${url}" aria-label="Ver foto ${i + 1}"
                    class="aspect-square overflow-hidden rounded-xl ring-2 ${i === 0 ? 'ring-bella-500' : 'ring-transparent'} transition hover:ring-bella-300">
                    <img src="${url}" alt="" loading="lazy" class="h-full w-full object-cover">
                </button>`).join('')}
        </div>`;
    return `
        <div>
            <div class="aspect-[4/3] overflow-hidden rounded-2xl bg-tinta/5">
                <img data-foto-grande src="${fotos[0]}" alt="${escapar(servicio.nombre)}" class="h-full w-full object-cover">
            </div>
            ${miniaturas}
        </div>`;
}

function detalleServicio(s) {
    const clave = claveServicio(s.nombre);
    return `
        <div class="grid animate-aparecer gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            ${galeria(s, clave)}
            <div>
                <h3 class="text-3xl font-bold sm:text-4xl">${escapar(s.nombre)}</h3>
                <p class="mt-3 text-base text-tinta/80">${DESCRIPCIONES[clave] || 'Servicio realizado por nuestras estilistas con productos profesionales.'}</p>
                <div class="mt-5 flex flex-wrap items-center gap-3">
                    <span class="font-titulo text-4xl font-bold text-oro">${pesos(s.precio)}</span>
                    <span class="rounded-full border border-tinta/15 px-3 py-1 text-sm font-semibold text-tinta/80">${s.duracion_min} min</span>
                </div>
                <a href="register.html?rol=cliente" class="btn-primario mt-6 px-6 py-3 text-base">Agendar este servicio &rarr;</a>
            </div>
        </div>`;
}

async function dibujarMenuServicios(contenedor) {
    const [respuesta, fotos] = await Promise.all([pedir('/servicios'), pedir('/fotos-servicios')]);
    fotosPorServicio = {};
    (fotos.data || []).forEach((f) => {
        (fotosPorServicio[f.id_servicio] = fotosPorServicio[f.id_servicio] || []).push(f.url);
    });
    if (!respuesta.success || respuesta.data.length === 0) {
        contenedor.innerHTML = '<p class="text-tinta/80">Enciende el servidor para ver los servicios.</p>';
        return;
    }
    const servicios = respuesta.data;
    contenedor.innerHTML = `
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="Servicios">
            ${servicios.map((s, i) => `
                <button type="button" role="tab" data-indice="${i}"
                    class="boton-servicio flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition">
                    ${iconoServicio(claveServicio(s.nombre), 'h-5 w-5')}${escapar(s.nombre)}
                </button>`).join('')}
        </div>
        <div class="tarjeta mt-4 p-5 sm:p-7" data-detalle></div>`;

    const botones = contenedor.querySelectorAll('[data-indice]');
    const detalle = contenedor.querySelector('[data-detalle]');
    function escoger(i) {
        botones.forEach((b) => {
            const activo = Number(b.dataset.indice) === i;
            b.setAttribute('aria-selected', activo);
            b.classList.toggle('boton-servicio-activo', activo);
        });
        detalle.innerHTML = detalleServicio(servicios[i]);
        // Miniaturas: al tocar una, se muestra en grande
        detalle.querySelectorAll('[data-miniatura]').forEach((m) => m.addEventListener('click', () => {
            detalle.querySelector('[data-foto-grande]').src = m.dataset.miniatura;
            detalle.querySelectorAll('[data-miniatura]').forEach((x) => {
                x.classList.toggle('ring-bella-500', x === m);
                x.classList.toggle('ring-transparent', x !== m);
            });
        }));
    }
    botones.forEach((b) => b.addEventListener('click', () => escoger(Number(b.dataset.indice))));
    escoger(0);
}

document.querySelectorAll('[data-menu-servicios]').forEach(dibujarMenuServicios);
