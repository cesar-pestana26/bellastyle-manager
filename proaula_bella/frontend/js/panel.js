// Panel principal (panel.html). Muestra una sección distinta según el rol.

const usuario = obtenerSesion();
if (!usuario) window.location.href = 'index.html';

let servicios = [];     // servicios disponibles (para agendar y registrar)
let estilistas = [];    // estilistas activas (para agendar)
let citasAdmin = [];

// ---------------------------------------------------------------
// Utilidades de la página
// ---------------------------------------------------------------

function avisar(mensaje) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = mensaje;
    aviso.classList.remove('opacity-0', '-translate-y-4');
    clearTimeout(aviso.temporizador);
    aviso.temporizador = setTimeout(() => aviso.classList.add('opacity-0', '-translate-y-4'), 3500);
}

// Igual que escapar(), pero también protege las comillas (para usar dentro de value="...")
function atributo(texto) {
    return escapar(texto).replace(/"/g, '&quot;');
}

const ICONOS = {
    calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
    dinero: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    estrella: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    persona: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    tijera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>',
    lista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>'
};

// Tarjeta de número grande (métricas). "tono" cambia el color del ícono.
const TONOS = {
    rosa: 'bg-bella-100 text-bella-700',
    lavanda: 'bg-lavanda-100 text-lavanda-500',
    verde: 'bg-emerald-50 text-emerald-700',
    oro: 'bg-amber-50 text-amber-700'
};
function tarjetaMetrica(titulo, valor, icono = 'calendario', tono = 'rosa') {
    return `
        <div class="tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <span class="icono h-10 w-10 sm:h-12 sm:w-12 ${TONOS[tono]}">${ICONOS[icono]}</span>
            <div class="min-w-0">
                <p class="text-sm font-medium text-tinta/70">${titulo}</p>
                <p class="mt-0.5 text-xl font-bold tabular-nums text-tinta sm:text-3xl">${valor}</p>
            </div>
        </div>`;
}

// Fila que se muestra cuando una tabla no tiene datos: ícono, mensaje y una ayuda
function filaVacia(columnas, texto = 'No hay registros', ayuda = 'Cuando haya datos aparecerán aquí.') {
    return `<tr><td colspan="${columnas}" class="py-12">
        <div class="mx-auto flex max-w-xs flex-col items-center gap-3 text-center">
            <span class="icono h-14 w-14 bg-lavanda-100 text-lavanda-500">${ICONOS.lista}</span>
            <p class="font-semibold text-tinta">${texto}</p>
            <p class="text-sm text-tinta/65">${ayuda}</p>
        </div></td></tr>`;
}

function etiquetaEstado(estado) {
    return `<span class="estado estado-${estado}">${estado}</span>`;
}

// Etiqueta para Activo / Disponible (verde) o Inactivo / No disponible (gris)
function etiquetaActivo(estado) {
    const activo = estado === 'Activo' || estado === 'Disponible';
    return `<span class="estado ${activo ? 'estado-Finalizada' : 'bg-tinta/10 text-tinta/65'}">${estado}</span>`;
}

const COLORES = {
    azul: 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
    verde: 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    rojo: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    gris: 'btn-mini-gris'
};

// Botón que hace un cambio en la API después de pedir confirmación.
// url y cuerpo se guardan en atributos data-* del botón.
function botonAccion(texto, color, url, cuerpo) {
    return `<button class="btn-mini ${COLORES[color]}" data-url="${url}" data-cuerpo="${atributo(JSON.stringify(cuerpo))}">${texto}</button>`;
}

// Botón que abre una ventana de edición. "accion" es el nombre de la función a llamar.
function botonEditar(texto, accion, id) {
    return `<button class="btn-mini ${COLORES.gris}" data-editar="${accion}" data-id="${id}">${texto}</button>`;
}

// Activa los botones de una tabla:
//  - los de data-url piden "¿Seguro?" en la misma celda y luego envían el cambio (PUT)
//  - los de data-editar abren la ventana de edición correspondiente
function activarBotones(tabla, recargar) {
    tabla.querySelectorAll('button[data-url]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const celda = boton.closest('td');
            const original = celda.innerHTML;
            celda.innerHTML = `
                <span class="mr-2 text-xs text-tinta/75">¿Seguro?</span>
                <button class="btn-mini bg-bella-700 text-white hover:bg-bella-800" data-si>Sí</button>
                <button class="btn-mini btn-mini-gris" data-no>No</button>`;
            celda.querySelector('[data-no]').onclick = () => {
                celda.innerHTML = original;
                activarBotones(tabla, recargar);
            };
            celda.querySelector('[data-si]').onclick = async () => {
                const respuesta = await pedir(boton.dataset.url, 'PUT', JSON.parse(boton.dataset.cuerpo));
                avisar(respuesta.message);
                recargar();
            };
        });
    });

    tabla.querySelectorAll('button[data-editar]').forEach((boton) => {
        boton.addEventListener('click', () => EDITORES[boton.dataset.editar](boton.dataset.id));
    });
}

// ---------------------------------------------------------------
// Ventana de edición (un solo <dialog> que se reutiliza para todo)
// ---------------------------------------------------------------

let alGuardarVentana = null;

// alGuardar = null -> ventana solo para leer (sin botón Guardar)
function abrirVentana(titulo, camposHtml, alGuardar) {
    document.getElementById('tituloVentana').textContent = titulo;
    document.getElementById('camposVentana').innerHTML = camposHtml;
    ocultarAlerta(document.getElementById('alertaVentana'));
    alGuardarVentana = alGuardar;
    const botonGuardar = document.querySelector('#formVentana button[type="submit"]');
    botonGuardar.classList.toggle('hidden', !alGuardar);
    botonGuardar.textContent = 'Guardar';
    // Ventana solo para ver (sin guardar): el botón de abajo dice "Cerrar"
    document.getElementById('btnCerrarVentana').textContent = alGuardar ? 'Cancelar' : 'Cerrar';
    const ventana = document.getElementById('ventana');
    if (!ventana.open) ventana.showModal();
}

function cerrarVentana() {
    document.getElementById('ventana').close();
}

document.getElementById('btnCerrarVentana').addEventListener('click', cerrarVentana);

document.getElementById('formVentana').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!alGuardarVentana) return;
    const respuesta = await alGuardarVentana();
    if (respuesta.success) {
        cerrarVentana();
        avisar(respuesta.message);
    } else {
        mostrarAlerta(document.getElementById('alertaVentana'), respuesta.message);
    }
});

function campo(id, etiqueta, valor = '', tipo = 'text', extra = '') {
    return `
        <div>
            <label for="${id}" class="etiqueta">${etiqueta}</label>
            <input id="${id}" type="${tipo}" class="campo" value="${atributo(valor)}" ${extra}>
        </div>`;
}

function casillasServicios(lista, seleccionados = []) {
    return `
        <div>
            <p class="etiqueta">Servicios que realiza</p>
            <div class="grid gap-2 sm:grid-cols-2">
                ${lista.map((s) => `
                    <label class="flex items-center gap-2 rounded-lg bg-tinta/5 px-3 py-2 text-sm">
                        <input type="checkbox" name="servicioVentana" value="${s.id_servicio}" class="accent-bella-500"
                               ${seleccionados.includes(String(s.id_servicio)) ? 'checked' : ''}>
                        ${escapar(s.nombre)}
                    </label>`).join('')}
            </div>
        </div>`;
}

function valor(id) {
    return document.getElementById(id).value.trim();
}

function serviciosMarcados() {
    return [...document.querySelectorAll('input[name="servicioVentana"]:checked')].map((c) => Number(c.value));
}

// Opciones de hora cada 30 minutos entre "desde" y "hasta" (en minutos)
function opcionesHora(seleccionada = '', desde = 8 * 60, hasta = 19 * 60) {
    let opciones = '';
    for (let minutos = desde; minutos <= hasta; minutos += 30) {
        const h = String(Math.floor(minutos / 60)).padStart(2, '0');
        const m = String(minutos % 60).padStart(2, '0');
        const hora = `${h}:${m}`;
        opciones += `<option value="${hora}" ${hora === seleccionada ? 'selected' : ''}>${hora}</option>`;
    }
    return opciones;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// 4 -> "★★★★☆"
function estrellas(n) {
    const llenas = Math.round(Number(n) || 0);
    return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

// Texto del promedio de una estilista: "★ 4.5 (2 opiniones)"
function textoCalificacion(e) {
    if (!e || !e.num_calificaciones) return 'Sin calificaciones todavía';
    const n = Number(e.num_calificaciones);
    return `★ ${Number(e.promedio).toFixed(1)} (${n} ${n === 1 ? 'opinión' : 'opiniones'})`;
}

// Botón "Chat" de una cita, con el número de mensajes sin leer
function botonChat(idCita, sinLeer) {
    const contador = Number(sinLeer) > 0
        ? ` <span class="ml-1 rounded-full bg-bella-700 px-1.5 text-[10px] font-bold text-white">${sinLeer}</span>`
        : '';
    return `<button class="btn-mini ${COLORES.gris}" data-editar="abrirChatCita" data-id="${idCita}">Chat${contador}</button>`;
}

function fechaDeHoy() {
    const hoy = new Date();
    return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------
// Encabezado
// ---------------------------------------------------------------

function prepararEncabezado() {
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol;
    // Foto de perfil (si no ha subido una, el servidor devuelve el ícono de su rol)
    mostrarFotoPerfil();
    document.getElementById('rolPortada').textContent = usuario.rol;
    document.getElementById('btnCambiarFoto').addEventListener('click', () => document.getElementById('archivoFotoPerfil').click());
    document.getElementById('archivoFotoPerfil').addEventListener('change', cambiarFotoPerfil);
    document.getElementById('btnQuitarFoto').addEventListener('click', quitarFotoPerfil);
    if (usuario.rol === 'Administradora') {
        const boton = document.getElementById('btnEditarNombre');
        boton.classList.remove('hidden');
        boton.addEventListener('click', editarMiNombre);
    }
    // La administradora ve un saludo general; los demás roles ven su nombre
    document.getElementById('saludo').textContent = usuario.rol === 'Administradora'
        ? 'Bienvenida a tu salón de belleza'
        : 'Hola, ' + usuario.nombre.split(' ')[0];
    document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

    const subtitulos = {
        Clienta: 'Agenda una cita nueva o administra las que ya tienes.',
        Estilista: 'Tus citas, tu horario y tu vitrina de trabajos.',
        Administradora: 'Resumen general del salón, tu equipo y la vitrina.'
    };
    document.getElementById('subtitulo').textContent = subtitulos[usuario.rol];

    // Muestra solo la sección del rol
    const seccion = document.querySelector(`[data-rol="${usuario.rol}"]`);
    seccion.classList.remove('hidden');
    if (usuario.rol === 'Clienta') seccion.classList.add('grid');
}

// ---------------------------------------------------------------
// CLIENTA
// ---------------------------------------------------------------

let miPerfilClienta = null;
let citasClienta = [];

// Al cambiar el servicio, solo se muestran las estilistas que lo realizan
function filtrarEstilistas() {
    const idServicio = document.getElementById('servicio').value;
    const capacitadas = estilistas.filter((e) => (e.ids_servicios || '').split(',').includes(idServicio));
    document.getElementById('estilista').innerHTML =
        '<option value="">Asignación automática</option>' +
        capacitadas.map((e) => {
            const nota = e.num_calificaciones ? ` · ★ ${Number(e.promedio).toFixed(1)}` : '';
            return `<option value="${e.id_estilista}">${escapar(e.nombres + ' ' + e.apellidos)}${nota}</option>`;
        }).join('');
    cargarHorasLibres();
}

// Pide al servidor las horas libres para el servicio, la estilista y la fecha escogidos,
// y las dibuja como botones. Al tocar uno, esa hora queda guardada en el campo oculto #hora.
async function cargarHorasLibres() {
    const contenedor = document.getElementById('horasLibres');
    const aviso = document.getElementById('avisoHoras');
    const campoHora = document.getElementById('hora');
    const idServicio = document.getElementById('servicio').value;
    const idEstilista = document.getElementById('estilista').value;
    const fecha = document.getElementById('fecha').value;
    const anterior = campoHora.value;

    contenedor.innerHTML = '';
    campoHora.value = '';
    if (!idServicio || !fecha) {
        aviso.textContent = 'Escoge el servicio y la fecha para ver las horas libres.';
        return;
    }
    if (new Date(fecha + 'T12:00:00').getDay() === 0) {
        aviso.textContent = 'El salón no atiende los domingos.';
        return;
    }

    aviso.textContent = 'Buscando horas libres...';
    const parametros = new URLSearchParams({ idServicio, fecha, idUsuario: usuario.id });
    if (idEstilista) parametros.set('idEstilista', idEstilista);
    const respuesta = await pedir('/disponibilidad?' + parametros);
    const horas = respuesta.success ? respuesta.data.horas : [];

    if (horas.length === 0) {
        aviso.textContent = respuesta.success
            ? 'No hay horas libres ese día. Prueba otra fecha u otra estilista.'
            : respuesta.message;
        return;
    }
    aviso.textContent = `${horas.length} horas libres. Toca una para escogerla.`;
    contenedor.innerHTML = horas.map((h) =>
        `<button type="button" data-hora="${h}" class="hora-libre">${h}</button>`).join('');
    contenedor.querySelectorAll('[data-hora]').forEach((boton) => {
        boton.addEventListener('click', () => escogerHora(boton.dataset.hora));
    });
    if (horas.includes(anterior)) escogerHora(anterior);
}

function escogerHora(hora) {
    document.getElementById('hora').value = hora;
    document.querySelectorAll('#horasLibres [data-hora]').forEach((b) => {
        b.classList.toggle('hora-escogida', b.dataset.hora === hora);
    });
}

async function iniciarClienta() {
    // Solo se ofrecen los servicios que al menos una estilista activa sabe hacer
    const conEstilista = servicios.filter((s) =>
        estilistas.some((e) => (e.ids_servicios || '').split(',').includes(String(s.id_servicio))));
    const select = document.getElementById('servicio');
    select.innerHTML = conEstilista.map((s) =>
        `<option value="${s.id_servicio}">${escapar(s.nombre)} · ${pesos(s.precio)} · ${s.duracion_min} min</option>`).join('');
    select.addEventListener('change', filtrarEstilistas);
    document.getElementById('estilista').addEventListener('change', cargarHorasLibres);
    document.getElementById('fecha').addEventListener('change', cargarHorasLibres);
    document.getElementById('fecha').min = fechaDeHoy();
    filtrarEstilistas();

    document.getElementById('formCita').addEventListener('submit', agendarCita);
    document.getElementById('btnEditarMisDatos').addEventListener('click', editarMisDatos);
    cargarEstilistasClienta();
    cargarMisDatos();
    cargarCitasClienta();
    // Cada 15 segundos se actualiza la tabla (mensajes nuevos de la estilista, cambios de estado)
    setInterval(() => actualizarSiNoHayConfirmacion('tablaCitasClienta', cargarCitasClienta), 15000);
}

// Recarga una tabla solo si nadie está respondiendo un "¿Seguro?" en ella
function actualizarSiNoHayConfirmacion(idTabla, recargar) {
    if (!document.querySelector(`#${idTabla} [data-si]`)) recargar();
}

async function agendarCita(e) {
    e.preventDefault();
    const alerta = document.getElementById('alertaCita');
    ocultarAlerta(alerta);

    const fecha = document.getElementById('fecha').value;
    if (new Date(fecha + 'T12:00:00').getDay() === 0) {
        return mostrarAlerta(alerta, 'El salón no atiende los domingos.');
    }
    if (!document.getElementById('hora').value) {
        return mostrarAlerta(alerta, 'Escoge una de las horas disponibles.');
    }

    const respuesta = await pedir('/citas', 'POST', {
        idUsuario: usuario.id,
        idServicio: document.getElementById('servicio').value,
        idEstilista: document.getElementById('estilista').value || null,
        fecha,
        hora: document.getElementById('hora').value,
        observaciones: document.getElementById('observaciones').value.trim()
    });

    if (respuesta.success) {
        mostrarAlerta(alerta, respuesta.message, 'ok');
        document.getElementById('observaciones').value = '';
        cargarCitasClienta();
        cargarHorasLibres();
        // Al agendar se abre el chat con la estilista asignada
        abrirChatCita(respuesta.id, true);
    } else {
        mostrarAlerta(alerta, respuesta.message);
        cargarHorasLibres();
    }
}

async function cargarMisDatos() {
    miPerfilClienta = (await pedir(`/clientas/usuario/${usuario.id}`)).data;
    if (!miPerfilClienta) return;
    const c = miPerfilClienta;
    document.getElementById('misDatos').innerHTML = `
        <div><dt class="inline text-tinta/60">Nombre:</dt> <dd class="inline">${escapar(c.nombres + ' ' + c.apellidos)}</dd></div>
        <div><dt class="inline text-tinta/60">Teléfono:</dt> <dd class="inline">${escapar(c.telefono || '—')}</dd></div>
        <div><dt class="inline text-tinta/60">Correo:</dt> <dd class="inline">${escapar(c.email || '—')}</dd></div>
        <div><dt class="inline text-tinta/60">Profesión:</dt> <dd class="inline">${escapar(c.profesion || '—')}</dd></div>`;
}

function editarMisDatos() {
    const c = miPerfilClienta;
    abrirVentana('Mis datos',
        campo('vNombres', 'Nombres', c.nombres, 'text', 'required') +
        campo('vApellidos', 'Apellidos', c.apellidos, 'text', 'required') +
        campo('vTelefono', 'Teléfono (10 dígitos)', c.telefono || '', 'tel', 'inputmode="numeric" maxlength="10"') +
        campo('vEmail', 'Correo', c.email || '', 'email') +
        campoProfesion(c.profesion),
        async () => {
            const respuesta = await pedir(`/clientas/${c.id_clienta}`, 'PUT', {
                nombres: valor('vNombres'), apellidos: valor('vApellidos'),
                telefono: valor('vTelefono'), email: valor('vEmail'), profesion: valor('vProfesion')
            });
            if (respuesta.success) cargarMisDatos();
            return respuesta;
        });
}

function reprogramarCita(idCita) {
    const cita = citasClienta.find((c) => String(c.id) === String(idCita));
    abrirVentana(`Reprogramar: ${cita.servicio}`,
        `<p class="text-sm text-tinta/65">Se mantiene la misma estilista (${escapar(cita.estilista)}). La cita vuelve a quedar pendiente.</p>
         <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Recuerda: cada cita se puede reprogramar <b>una sola vez</b>.</p>` +
        campo('vFecha', 'Nueva fecha', cita.fecha, 'date', `min="${fechaDeHoy()}" required`) +
        `<div>
            <label for="vHora" class="etiqueta">Nueva hora (libres de ${escapar(cita.estilista)})</label>
            <select id="vHora" class="campo" required></select>
        </div>`,
        async () => {
            if (!valor('vHora')) return { success: false, message: 'Escoge una hora libre.' };
            const respuesta = await pedir(`/citas/${idCita}/reprogramar`, 'PUT', { fecha: valor('vFecha'), hora: valor('vHora') });
            if (respuesta.success) cargarCitasClienta();
            return respuesta;
        });

    // Las horas libres de la misma estilista; la propia cita no cuenta como ocupada
    async function cargarHorasReprogramar() {
        const select = document.getElementById('vHora');
        const parametros = new URLSearchParams({
            idServicio: cita.id_servicio, idEstilista: cita.id_estilista,
            fecha: valor('vFecha'), excluirCita: cita.id, idUsuario: usuario.id
        });
        const respuesta = await pedir('/disponibilidad?' + parametros);
        const horas = respuesta.success ? respuesta.data.horas : [];
        select.innerHTML = horas.length === 0
            ? '<option value="">No hay horas libres ese día</option>'
            : horas.map((h) => `<option value="${h}" ${h === cita.hora ? 'selected' : ''}>${h}</option>`).join('');
    }
    document.getElementById('vFecha').addEventListener('change', cargarHorasReprogramar);
    cargarHorasReprogramar();
}

// Ventana para calificar una cita finalizada (1 a 5 estrellas y un comentario)
function calificarCita(idCita) {
    const cita = citasClienta.find((c) => String(c.id) === String(idCita));
    const opciones = [5, 4, 3, 2, 1].map((n) => `
        <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-tinta/5 px-3 py-2 hover:bg-tinta/10">
            <input type="radio" name="vEstrellas" value="${n}" class="accent-bella-500" ${n === 5 ? 'checked' : ''}>
            <span class="text-oro">${estrellas(n)}</span>
        </label>`).join('');
    abrirVentana(`Califica tu ${cita.servicio.toLowerCase()}`,
        `<p class="text-sm text-tinta/65">Te atendió ${escapar(cita.estilista)} el ${cita.fecha}.</p>
         <div class="space-y-2">${opciones}</div>
         <div>
            <label for="vComentario" class="etiqueta">Comentario (opcional)</label>
            <textarea id="vComentario" rows="2" maxlength="300" class="campo" placeholder="Ej: me encantó el resultado"></textarea>
         </div>`,
        async () => {
            const marcada = document.querySelector('input[name="vEstrellas"]:checked');
            const respuesta = await pedir(`/citas/${idCita}/calificacion`, 'POST', {
                idUsuario: usuario.id, estrellas: Number(marcada.value), comentario: valor('vComentario')
            });
            if (respuesta.success) cargarCitasClienta();
            return respuesta;
        });
}

async function cargarCitasClienta() {
    const tabla = document.getElementById('tablaCitasClienta');
    citasClienta = (await pedir(`/citas?rol=Clienta&idUsuario=${usuario.id}`)).data || [];

    tabla.innerHTML = citasClienta.length === 0 ? filaVacia(5, 'Todavía no tienes citas', 'Agenda la primera con el formulario de la izquierda.') : citasClienta.map((c) => {
        const activa = c.estado === 'Pendiente' || c.estado === 'Confirmada';
        let acciones = botonChat(c.id, c.sin_leer_clienta) + ' ';
        if (activa) {
            acciones += (c.reprogramaciones >= 1
                ? '<span class="mr-1 text-xs text-tinta/60" title="Cada cita se puede reprogramar una sola vez">Ya reprogramada</span> '
                : botonEditar('Reprogramar', 'reprogramarCita', c.id) + ' ') +
                botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        } else if (c.estado === 'Finalizada') {
            acciones += botonComprobante(c.id) + ' ';
            acciones += c.calificacion
                ? `<span class="text-sm text-oro" title="Tu calificación">${estrellas(c.calificacion)}</span>`
                : `<button class="btn-mini ${COLORES.verde}" data-editar="calificarCita" data-id="${c.id}">Calificar</button>`;
        }
        return `
            <tr>
                <td class="font-medium text-tinta">${escapar(c.servicio)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${escapar(c.estilista)}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasClienta);
}

// ---------------------------------------------------------------
// ESTILISTA
// ---------------------------------------------------------------

let miPerfilEstilista = null;

async function iniciarEstilista() {
    document.getElementById('btnEditarMisServicios').addEventListener('click', () => editarServiciosEstilista(miPerfilEstilista.id_estilista));
    document.getElementById('btnEditarMiHorario').addEventListener('click', () => editarHorario(miPerfilEstilista.id_estilista));
    document.getElementById('btnMisAusencias').addEventListener('click', () => verAusencias(miPerfilEstilista.id_estilista));
    document.getElementById('btnMisOpiniones').addEventListener('click', () => verOpiniones(miPerfilEstilista.id_estilista));
    document.getElementById('btnAgregarVitrina').addEventListener('click', () => agregarAVitrina(usuario.id, cargarMiVitrina));
    await cargarMiPerfilEstilista();
    cargarMiHorario();
    cargarMiVitrina();
    cargarCitasEstilista();
    // Cada 15 segundos se actualiza la tabla (mensajes nuevos de las clientas, citas nuevas)
    setInterval(() => actualizarSiNoHayConfirmacion('tablaCitasEstilista', cargarCitasEstilista), 15000);
}

async function cargarMiPerfilEstilista() {
    miPerfilEstilista = (await pedir(`/estilistas/usuario/${usuario.id}`)).data;
    const misServicios = miPerfilEstilista && miPerfilEstilista.servicios ? miPerfilEstilista.servicios.split(', ') : [];
    document.getElementById('misServicios').innerHTML = misServicios.length
        ? misServicios.map((n) => `<span class="rounded-full border border-bella-200 bg-bella-50 px-3 py-1 font-medium text-bella-800">${escapar(n)}</span>`).join('')
        : `<p>${miPerfilEstilista ? 'Aún no tienes servicios asignados.' : 'No se encontró tu perfil de estilista.'}</p>`;
    const cal = miPerfilEstilista;
    document.getElementById('miCalificacion').innerHTML = cal && cal.num_calificaciones
        ? `<div class="flex items-end gap-3">
               <span class="text-5xl font-bold tabular-nums text-tinta">${Number(cal.promedio).toFixed(1)}</span>
               <div class="pb-1">
                   <p class="text-xl tracking-wider text-amber-500">${estrellas(cal.promedio)}</p>
                   <p class="text-sm text-tinta/70">${cal.num_calificaciones} ${Number(cal.num_calificaciones) === 1 ? 'opinión' : 'opiniones'}</p>
               </div>
           </div>`
        : '<p>Aún no tienes calificaciones.</p>';
}

// Muestra los días y horas que trabaja la estilista y sus próximas ausencias
async function cargarMiHorario() {
    if (!miPerfilEstilista) return;
    const datos = (await pedir(`/estilistas/${miPerfilEstilista.id_estilista}/horario`)).data;
    if (!datos) return;
    const dias = [1, 2, 3, 4, 5, 6].map((dia) => {
        const h = datos.horario.find((x) => x.dia_semana === dia);
        return `<li class="flex justify-between py-2"><span class="font-medium text-tinta/75">${DIAS_SEMANA[dia]}</span>${h ? `<span class="font-semibold tabular-nums text-tinta">${h.hora_inicio} – ${h.hora_fin}</span>` : '<span class="rounded-full bg-tinta/5 px-2.5 py-0.5 text-xs font-semibold text-tinta/60">Libre</span>'}</li>`;
    });
    const hoy = fechaDeHoy();
    const proximas = datos.ausencias.filter((a) => a.fecha_fin >= hoy).map((a) =>
        `<li class="py-2 font-medium text-amber-800">Ausente del ${a.fecha_inicio} al ${a.fecha_fin}${a.motivo ? ' · ' + escapar(a.motivo) : ''}</li>`);
    document.getElementById('miHorario').innerHTML = dias.join('') + proximas.join('');
}

let citasEstilista = [];

async function cargarCitasEstilista() {
    const citas = (await pedir(`/citas?rol=Estilista&idUsuario=${usuario.id}`)).data || [];
    citasEstilista = citas;

    const finalizadas = citas.filter((c) => c.estado === 'Finalizada');
    const pendientes = citas.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const ganado = finalizadas.reduce((total, c) => total + Number(c.precio), 0);

    document.getElementById('metricasEstilista').innerHTML =
        tarjetaMetrica('Total de citas', citas.length, 'calendario', 'rosa') +
        tarjetaMetrica('Por atender', pendientes.length, 'reloj', 'lavanda') +
        tarjetaMetrica('Finalizadas', finalizadas.length, 'check', 'verde') +
        tarjetaMetrica('Mi comisión (40%)', pesos(ganado * 0.4), 'dinero', 'oro');

    const tabla = document.getElementById('tablaCitasEstilista');
    tabla.innerHTML = citas.length === 0 ? filaVacia(6, 'No tienes citas asignadas', 'Cuando te asignen una cita aparecerá aquí.') : citas.map((c) => {
        let acciones = '';
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += botonAccion('Finalizar', 'verde', `/citas/${c.id}/estado`, { estado: 'Finalizada' }) + ' ';
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' }) + ' ';
        }
        acciones += botonEditar('Historial', 'verHistorialClienta', c.id_cliente) + ' ';
        if (c.estado !== 'Cancelada') acciones += botonEditar(c.notas_servicio ? 'Notas ✓' : 'Notas', 'editarNotasServicio', c.id) + ' ';
        acciones += botonChat(c.id, c.sin_leer_estilista);
        return `
            <tr>
                <td class="font-mono text-xs text-tinta/65">BS-${c.id}</td>
                <td class="font-medium text-tinta">${escapar(c.cliente)}${c.profesion ? `<span class="block text-xs font-normal text-tinta/60">${escapar(c.profesion)}</span>` : ''}</td>
                <td>${escapar(c.servicio)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasEstilista);
}

// Ventana para cambiar los servicios de una estilista.
// La usan la estilista (sus propios servicios) y la administradora (cualquier estilista).
function editarServiciosEstilista(idEstilista) {
    const estilista = usuario.rol === 'Estilista'
        ? miPerfilEstilista
        : estilistasAdmin.find((e) => String(e.id_estilista) === String(idEstilista));
    const seleccionados = (estilista.ids_servicios || '').split(',');

    abrirVentana(`Servicios de ${estilista.nombres} ${estilista.apellidos}`,
        casillasServicios(servicios, seleccionados),
        async () => {
            const respuesta = await pedir(`/estilistas/${idEstilista}/servicios`, 'PUT', { servicios: serviciosMarcados() });
            if (respuesta.success) {
                if (usuario.rol === 'Estilista') cargarMiPerfilEstilista();
                else cargarEstilistasAdmin();
            }
            return respuesta;
        });
}

// Nombre de una estilista para los títulos de las ventanas
function nombreEstilista(idEstilista) {
    const e = usuario.rol === 'Estilista'
        ? miPerfilEstilista
        : estilistasAdmin.find((x) => String(x.id_estilista) === String(idEstilista));
    return e ? `${e.nombres} ${e.apellidos}` : 'la estilista';
}

// Ventana para cambiar los días y horas de trabajo (lunes a sábado)
async function editarHorario(idEstilista) {
    const datos = (await pedir(`/estilistas/${idEstilista}/horario`)).data;
    if (!datos) return avisar('No se pudo cargar el horario.');
    const filas = [1, 2, 3, 4, 5, 6].map((dia) => {
        const h = datos.horario.find((x) => x.dia_semana === dia);
        return `
            <div class="grid grid-cols-[7rem_1fr_1fr] items-center gap-2">
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="vDia" value="${dia}" class="accent-bella-500" ${h ? 'checked' : ''}>
                    ${DIAS_SEMANA[dia]}
                </label>
                <select id="vInicio${dia}" class="campo py-1.5">${opcionesHora(h ? h.hora_inicio : '08:00', 8 * 60, 18 * 60)}</select>
                <select id="vFin${dia}" class="campo py-1.5">${opcionesHora(h ? h.hora_fin : '19:00', 9 * 60, 19 * 60)}</select>
            </div>`;
    }).join('');

    abrirVentana(`Horario de ${nombreEstilista(idEstilista)}`,
        `<p class="text-sm text-tinta/65">Marca los días que trabaja y escoge la hora de entrada y de salida. Los días sin marcar son libres.</p>
         <div class="grid grid-cols-[7rem_1fr_1fr] gap-2 text-xs uppercase tracking-wider text-tinta/60"><span>Día</span><span>Entrada</span><span>Salida</span></div>
         <div class="space-y-2">${filas}</div>`,
        async () => {
            const dias = [...document.querySelectorAll('input[name="vDia"]:checked')].map((c) => ({
                dia: Number(c.value), inicio: valor('vInicio' + c.value), fin: valor('vFin' + c.value)
            }));
            const respuesta = await pedir(`/estilistas/${idEstilista}/horario`, 'PUT', { dias });
            if (respuesta.success && usuario.rol === 'Estilista') cargarMiHorario();
            return respuesta;
        });
}

// Ventana con las ausencias (vacaciones, permisos) y un formulario para agregar otra
async function verAusencias(idEstilista) {
    const datos = (await pedir(`/estilistas/${idEstilista}/horario`)).data;
    if (!datos) return avisar('No se pudieron cargar las ausencias.');
    const lista = datos.ausencias.length === 0
        ? '<p class="text-sm text-tinta/60">No tiene ausencias registradas.</p>'
        : `<ul class="space-y-2">${datos.ausencias.map((a) => `
            <li class="flex items-center justify-between gap-3 rounded-lg bg-tinta/5 px-3 py-2 text-sm">
                <span>${a.fecha_inicio} al ${a.fecha_fin}${a.motivo ? ` · <span class="text-tinta/65">${escapar(a.motivo)}</span>` : ''}</span>
                <button type="button" class="btn-mini ${COLORES.rojo}" data-quitar-ausencia="${a.id_ausencia}">Quitar</button>
            </li>`).join('')}</ul>`;

    abrirVentana(`Ausencias de ${nombreEstilista(idEstilista)}`,
        lista +
        `<p class="border-t border-tinta/10 pt-4 text-sm font-semibold text-tinta">Agregar ausencia</p>
         <div class="grid grid-cols-2 gap-3">
            ${campo('vDesde', 'Desde', '', 'date', `min="${fechaDeHoy()}" required`)}
            ${campo('vHasta', 'Hasta', '', 'date', `min="${fechaDeHoy()}" required`)}
         </div>` +
        campo('vMotivo', 'Motivo (opcional)', '', 'text', 'maxlength="120" placeholder="Ej: vacaciones"'),
        async () => {
            const respuesta = await pedir(`/estilistas/${idEstilista}/ausencias`, 'POST', {
                desde: valor('vDesde'), hasta: valor('vHasta'), motivo: valor('vMotivo')
            });
            if (respuesta.success && usuario.rol === 'Estilista') cargarMiHorario();
            return respuesta;
        });

    document.querySelectorAll('[data-quitar-ausencia]').forEach((boton) => {
        boton.addEventListener('click', async () => {
            const respuesta = await pedir(`/ausencias/${boton.dataset.quitarAusencia}`, 'DELETE');
            avisar(respuesta.message);
            if (usuario.rol === 'Estilista') cargarMiHorario();
            verAusencias(idEstilista);
        });
    });
}

// Ventana (solo lectura) con las calificaciones que ha recibido una estilista
async function verOpiniones(idEstilista) {
    const opiniones = (await pedir(`/estilistas/${idEstilista}/calificaciones`)).data || [];
    const contenido = opiniones.length === 0
        ? '<p class="text-sm text-tinta/60">Todavía no tiene calificaciones.</p>'
        : `<ul class="max-h-80 space-y-3 overflow-y-auto">${opiniones.map((o) => `
            <li class="rounded-lg bg-tinta/5 px-3 py-2">
                <p class="flex justify-between text-sm"><span class="text-oro">${estrellas(o.estrellas)}</span><span class="text-xs text-tinta/60">${o.fecha}</span></p>
                <p class="mt-1 text-sm text-tinta/80">${o.comentario ? escapar(o.comentario) : '<span class="text-tinta/45">Sin comentario</span>'}</p>
                <p class="mt-1 text-xs text-tinta/60">${escapar(o.cliente)} · ${escapar(o.servicio)}</p>
            </li>`).join('')}</ul>`;
    abrirVentana(`Opiniones de ${nombreEstilista(idEstilista)}`, contenido, null);
}

// ---------------------------------------------------------------
// CHAT DE LA CITA (clienta <-> estilista)
// Mientras la ventana está abierta, cada 4 segundos se piden los mensajes nuevos.
// ---------------------------------------------------------------

const chatCita = { id: null, ultimo: 0, temporizador: null, recienAgendada: false };

function abrirChatCita(idCita, recienAgendada = false) {
    chatCita.id = idCita;
    chatCita.ultimo = 0;
    chatCita.recienAgendada = recienAgendada === true;
    document.getElementById('mensajesCita').innerHTML = '';
    document.getElementById('tituloChat').textContent = 'Chat de la cita';
    document.getElementById('detalleChat').textContent = '';
    document.getElementById('ventanaChat').showModal();
    cargarMensajesCita();
    clearInterval(chatCita.temporizador);
    chatCita.temporizador = setInterval(cargarMensajesCita, 4000);
}

function dibujarMensajeCita(m) {
    const mio = m.autor === usuario.rol;
    document.getElementById('mensajesCita').insertAdjacentHTML('beforeend', `
        <div class="max-w-[80%] ${mio ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] text-tinta/60">${mio ? 'Tú' : m.autor} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-sm ${mio ? 'bg-bella-200 text-tinta' : 'border border-tinta/10 bg-white/70 text-tinta'}">${escapar(m.texto)}</p>
        </div>`);
}

async function cargarMensajesCita() {
    if (!chatCita.id) return;
    const parametros = new URLSearchParams({ rol: usuario.rol, idUsuario: usuario.id, desde: chatCita.ultimo });
    const respuesta = await pedir(`/citas/${chatCita.id}/mensajes?` + parametros);
    if (!respuesta.success) {
        avisar(respuesta.message);
        return cerrarChatCita();
    }

    const { cita, mensajes } = respuesta.data;
    const otraPersona = usuario.rol === 'Clienta' ? cita.estilista : cita.cliente;
    document.getElementById('tituloChat').textContent = `Chat con ${otraPersona}`;
    document.getElementById('detalleChat').textContent = `${cita.servicio} · ${cita.fecha} · ${cita.hora} · ${cita.estado}`;

    const caja = document.getElementById('mensajesCita');
    if (chatCita.ultimo === 0 && mensajes.length === 0) {
        caja.innerHTML = `<p class="text-center text-sm text-tinta/60">${chatCita.recienAgendada
            ? `¡Tu cita quedó agendada! Si quieres, escríbele a ${escapar(otraPersona)}: cuéntale qué buscas o envíale una idea.`
            : 'Todavía no hay mensajes en esta cita.'}</p>`;
    } else if (mensajes.length > 0) {
        if (chatCita.ultimo === 0) caja.innerHTML = '';
        mensajes.forEach((m) => {
            dibujarMensajeCita(m);
            chatCita.ultimo = m.id;
        });
        caja.scrollTop = caja.scrollHeight;
    }

    // Cuando la cita termina o se cancela, el chat queda solo para leer
    document.getElementById('formChatCita').classList.toggle('hidden', !cita.abierto);
    const cerrado = document.getElementById('chatCerrado');
    cerrado.classList.toggle('hidden', cita.abierto);
    cerrado.textContent = `La cita quedó ${cita.estado.toLowerCase()}: el chat es solo para leer.`;
}

function cerrarChatCita() {
    document.getElementById('ventanaChat').close();
}

document.getElementById('btnCerrarChat').addEventListener('click', cerrarChatCita);

// Al cerrar la ventana se deja de preguntar y se actualiza la tabla (contador de no leídos)
document.getElementById('ventanaChat').addEventListener('close', () => {
    clearInterval(chatCita.temporizador);
    chatCita.id = null;
    if (usuario.rol === 'Clienta') cargarCitasClienta();
    if (usuario.rol === 'Estilista') cargarCitasEstilista();
});

document.getElementById('formChatCita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoTexto = document.getElementById('textoChatCita');
    const texto = campoTexto.value.trim();
    if (!texto || !chatCita.id) return;
    const respuesta = await pedir(`/citas/${chatCita.id}/mensajes`, 'POST', { rol: usuario.rol, idUsuario: usuario.id, texto });
    if (!respuesta.success) return avisar(respuesta.message);
    campoTexto.value = '';
    if (chatCita.ultimo === 0) document.getElementById('mensajesCita').innerHTML = '';
    await cargarMensajesCita();
});

// ---------------------------------------------------------------
// ADMINISTRADORA
// ---------------------------------------------------------------

let estilistasAdmin = [];
let clientasAdmin = [];
let serviciosAdmin = [];
let productosAdmin = [];

function activarPestanas() {
    document.querySelectorAll('[data-pestana]').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('[data-pestana]').forEach((b) => b.classList.remove('pestana-activa'));
            boton.classList.add('pestana-activa');
            document.querySelectorAll('[data-panel]').forEach((panel) => {
                panel.classList.toggle('hidden', panel.dataset.panel !== boton.dataset.pestana);
            });
        });
    });
}

// --- Citas ---

async function cargarCitasAdmin() {
    citasAdmin = (await pedir('/citas')).data || [];

    const finalizadas = citasAdmin.filter((c) => c.estado === 'Finalizada');
    const pendientes = citasAdmin.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const ingresos = finalizadas.reduce((total, c) => total + Number(c.precio), 0);

    document.getElementById('metricasAdmin').innerHTML =
        tarjetaMetrica('Total de citas', citasAdmin.length, 'calendario', 'rosa') +
        tarjetaMetrica('Por atender', pendientes.length, 'reloj', 'lavanda') +
        tarjetaMetrica('Finalizadas', finalizadas.length, 'check', 'verde') +
        tarjetaMetrica('Ingresos', pesos(ingresos), 'dinero', 'oro');

    dibujarCitasAdmin();
}

function dibujarCitasAdmin() {
    const filtro = document.getElementById('filtroEstado').value;
    const citas = filtro ? citasAdmin.filter((c) => c.estado === filtro) : citasAdmin;
    const tabla = document.getElementById('tablaCitasAdmin');

    tabla.innerHTML = citas.length === 0 ? filaVacia(7) : citas.map((c) => {
        let acciones = '';
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' }) + ' ';
        }
        if (c.estado === 'Finalizada') acciones += botonComprobante(c.id) + ' ';
        if (c.estado !== 'Cancelada') acciones += botonEditar(c.notas_servicio ? 'Notas ✓' : 'Notas', 'editarNotasServicio', c.id) + ' ';
        acciones += botonEditar('Historial', 'verHistorialClienta', c.id_cliente);
        return `
            <tr>
                <td class="font-mono text-xs text-tinta/65">BS-${c.id}</td>
                <td class="font-medium text-tinta">${escapar(c.cliente)}</td>
                <td>${escapar(c.servicio)}</td>
                <td>${escapar(c.estilista)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasAdmin);
}

// --- Estilistas ---

async function cargarEstilistasAdmin() {
    estilistasAdmin = (await pedir('/estilistas?todos=1')).data || [];
    estilistas = estilistasAdmin.filter((e) => e.estado === 'Activo');
    const tabla = document.getElementById('tablaEstilistas');

    tabla.innerHTML = estilistasAdmin.length === 0 ? filaVacia(5) : estilistasAdmin.map((e) => {
        const cambio = e.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/estilistas/${e.id_estilista}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/estilistas/${e.id_estilista}/estado`, { estado: 'Activo' });
        return `
            <tr>
                <td class="font-medium text-tinta"><span class="flex items-center gap-3"><img src="${fotoDe(e.id_usuario)}" alt="" class="h-9 w-9 shrink-0 rounded-xl object-cover">${escapar(e.nombres + ' ' + e.apellidos)}</span></td>
                <td class="text-tinta/75">${escapar(e.servicios || 'Sin servicios')}</td>
                <td class="whitespace-nowrap text-sm ${e.num_calificaciones ? 'text-oro' : 'text-tinta/45'}">${e.num_calificaciones ? `★ ${Number(e.promedio).toFixed(1)} (${e.num_calificaciones})` : '—'}</td>
                <td>${etiquetaActivo(e.estado)}</td>
                <td class="whitespace-nowrap text-right">
                    ${botonEditar('Servicios', 'editarServiciosEstilista', e.id_estilista)}
                    ${botonEditar('Horario', 'editarHorario', e.id_estilista)}
                    ${botonEditar('Ausencias', 'verAusencias', e.id_estilista)}
                    ${botonEditar('Opiniones', 'verOpiniones', e.id_estilista)}
                    ${cambio}
                </td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarEstilistasAdmin);
}

// --- Clientas ---

async function cargarClientasAdmin() {
    clientasAdmin = (await pedir('/clientas')).data || [];
    const tabla = document.getElementById('tablaClientas');

    tabla.innerHTML = clientasAdmin.length === 0 ? filaVacia(6) : clientasAdmin.map((c) => `
        <tr>
            <td class="font-medium text-tinta">${escapar(c.nombres + ' ' + c.apellidos)}</td>
            <td>${escapar(c.telefono || '—')}</td>
            <td>${escapar(c.email || '—')}</td>
            <td>${escapar(c.profesion || '—')}</td>
            <td>${c.id_usuario ? '<span class="estado estado-Finalizada">Con cuenta</span>' : '<span class="estado bg-tinta/10 text-tinta/65">Sin cuenta</span>'}</td>
            <td class="whitespace-nowrap text-right">${botonEditar('Historial', 'verHistorialClienta', c.id_clienta)} ${botonEditar('Editar', 'editarClienta', c.id_clienta)}</td>
        </tr>`).join('');

    activarBotones(tabla, cargarClientasAdmin);
}

function editarClienta(idClienta) {
    const c = clientasAdmin.find((x) => String(x.id_clienta) === String(idClienta));
    abrirVentana('Editar clienta',
        campo('vNombres', 'Nombres', c.nombres, 'text', 'required') +
        campo('vApellidos', 'Apellidos', c.apellidos, 'text', 'required') +
        campo('vTelefono', 'Teléfono (10 dígitos)', c.telefono || '', 'tel', 'inputmode="numeric" maxlength="10"') +
        campo('vEmail', 'Correo', c.email || '', 'email') +
        campoProfesion(c.profesion),
        async () => {
            const respuesta = await pedir(`/clientas/${idClienta}`, 'PUT', {
                nombres: valor('vNombres'), apellidos: valor('vApellidos'),
                telefono: valor('vTelefono'), email: valor('vEmail'), profesion: valor('vProfesion')
            });
            if (respuesta.success) cargarClientasAdmin();
            return respuesta;
        });
}

// --- Servicios ---

async function cargarServiciosAdmin() {
    serviciosAdmin = (await pedir('/servicios?todos=1')).data || [];
    servicios = serviciosAdmin.filter((s) => s.estado === 'Disponible');
    const tabla = document.getElementById('tablaServicios');

    tabla.innerHTML = serviciosAdmin.length === 0 ? filaVacia(5) : serviciosAdmin.map((s) => {
        const cambio = s.estado === 'Disponible'
            ? botonAccion('Desactivar', 'rojo', `/servicios/${s.id_servicio}/estado`, { estado: 'No disponible' })
            : botonAccion('Activar', 'verde', `/servicios/${s.id_servicio}/estado`, { estado: 'Disponible' });
        return `
            <tr>
                <td class="font-medium text-tinta">${escapar(s.nombre)}</td>
                <td>${pesos(s.precio)}</td>
                <td>${s.duracion_min} min</td>
                <td>${etiquetaActivo(s.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar('Fotos', 'fotosServicio', s.id_servicio)} ${botonEditar('Editar', 'editarServicio', s.id_servicio)} ${cambio}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarServiciosAdmin);
    dibujarCasillasNuevo();
}

// ---------------------------------------------------------------
// Fotos de un servicio: se ven en el menú de servicios de la página de inicio.
// Antes de subirla, la foto se reduce en el navegador (máximo 1200 px, formato WEBP)
// para que pese poco y cargue rápido.
// ---------------------------------------------------------------

function reducirImagen(archivo, maximo = 1200) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
        lector.onload = () => {
            const imagen = new Image();
            imagen.onerror = () => rechazar(new Error('El archivo no es una imagen.'));
            imagen.onload = () => {
                const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
                const lienzo = document.createElement('canvas');
                lienzo.width = Math.round(imagen.width * escala);
                lienzo.height = Math.round(imagen.height * escala);
                lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
                let datos = lienzo.toDataURL('image/webp', 0.82);
                if (!datos.startsWith('data:image/webp')) datos = lienzo.toDataURL('image/jpeg', 0.85);
                resolver(datos);
            };
            imagen.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}

async function fotosServicio(idServicio) {
    const s = serviciosAdmin.find((x) => String(x.id_servicio) === String(idServicio));
    const fotos = (await pedir(`/servicios/${idServicio}/fotos`)).data || [];
    const galeria = fotos.length === 0
        ? '<p class="text-sm text-tinta/70">Este servicio todavía no tiene fotos. En la página de inicio se ve una imagen de muestra.</p>'
        : `<div class="grid grid-cols-3 gap-2">${fotos.map((f, i) => `
            <figure class="relative aspect-square overflow-hidden rounded-xl bg-tinta/5">
                <img src="${f.url}" alt="" class="h-full w-full object-cover">
                ${i === 0 ? '<span class="absolute left-1.5 top-1.5 rounded-full bg-bella-700 px-2 py-0.5 text-[10px] font-bold text-white">Principal</span>' : ''}
                <button type="button" data-quitar-foto="${f.id_foto}" class="btn-mini absolute bottom-1.5 right-1.5 ${COLORES.rojo} bg-white">Quitar</button>
            </figure>`).join('')}</div>`;

    // Sin botón "Guardar": la foto se sube apenas se escoge
    abrirVentana(`Fotos · ${s ? s.nombre : ''}`,
        galeria + selectorDeFotos('vFotos', 'Agregar fotos (JPG, PNG o WEBP · máximo 6 por servicio)', true,
            'Se suben apenas las escoges. La primera foto es la principal (la que se ve en grande).'), null);

    document.getElementById('vFotos').addEventListener('change', async (e) => {
        const resultado = await subirArchivos([...e.target.files], (imagen) =>
            pedir(`/servicios/${idServicio}/fotos`, 'POST', { imagen }));
        avisar(resultado);
        fotosServicio(idServicio);
    });
    document.querySelectorAll('[data-quitar-foto]').forEach((boton) => {
        boton.addEventListener('click', async () => {
            const respuesta = await pedir(`/fotos/${boton.dataset.quitarFoto}`, 'DELETE');
            avisar(respuesta.message);
            fotosServicio(idServicio);
        });
    });
}

// idServicio vacío = crear uno nuevo
function editarServicio(idServicio) {
    const s = serviciosAdmin.find((x) => String(x.id_servicio) === String(idServicio)) || { nombre: '', precio: '', duracion_min: 60 };
    abrirVentana(idServicio ? 'Editar servicio' : 'Nuevo servicio',
        campo('vNombre', 'Nombre', s.nombre, 'text', 'required') +
        campo('vPrecio', 'Precio (pesos)', s.precio ? Math.round(s.precio) : '', 'number', 'min="0" step="500" required') +
        campo('vDuracion', 'Duración (minutos)', s.duracion_min, 'number', 'min="15" max="480" step="15" required'),
        async () => {
            const datos = { nombre: valor('vNombre'), precio: Number(valor('vPrecio')), duracion: Number(valor('vDuracion')) };
            const respuesta = idServicio
                ? await pedir(`/servicios/${idServicio}`, 'PUT', datos)
                : await pedir('/servicios', 'POST', datos);
            if (respuesta.success) cargarServiciosAdmin();
            return respuesta;
        });
}

// --- Productos ---

async function cargarProductosAdmin() {
    productosAdmin = (await pedir('/productos?todos=1')).data || [];
    const tabla = document.getElementById('tablaProductos');

    tabla.innerHTML = productosAdmin.length === 0 ? filaVacia(5) : productosAdmin.map((p) => {
        const cambio = p.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/productos/${p.id_producto}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/productos/${p.id_producto}/estado`, { estado: 'Activo' });
        return `
            <tr>
                <td class="font-medium text-tinta"><span class="flex items-center gap-3"><img src="/api/productos/${p.id_producto}/foto?v=${versionFoto}" alt="" class="h-11 w-11 shrink-0 rounded-xl object-cover">${escapar(p.nombre)}</span></td>
                <td>${pesos(p.precio)}</td>
                <td>${p.stock < 10 ? `<span class="estado estado-Cancelada">${p.stock} · bajo</span>` : p.stock}</td>
                <td>${etiquetaActivo(p.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar(Number(p.tiene_foto) ? 'Foto ✓' : 'Foto', 'fotoProducto', p.id_producto)} ${botonEditar('Editar', 'editarProducto', p.id_producto)} ${cambio}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarProductosAdmin);
}

// idProducto vacío = crear uno nuevo
function editarProducto(idProducto) {
    const p = productosAdmin.find((x) => String(x.id_producto) === String(idProducto)) || { nombre: '', precio: '', stock: 0 };
    abrirVentana(idProducto ? 'Editar producto' : 'Nuevo producto',
        campo('vNombre', 'Nombre', p.nombre, 'text', 'required') +
        campo('vPrecio', 'Precio (pesos)', p.precio ? Math.round(p.precio) : '', 'number', 'min="0" step="500" required') +
        campo('vStock', 'Stock (unidades)', p.stock, 'number', 'min="0" step="1" required'),
        async () => {
            const datos = { nombre: valor('vNombre'), precio: Number(valor('vPrecio')), stock: Number(valor('vStock')) };
            const respuesta = idProducto
                ? await pedir(`/productos/${idProducto}`, 'PUT', datos)
                : await pedir('/productos', 'POST', datos);
            if (respuesta.success) cargarProductosAdmin();
            return respuesta;
        });
}

// --- Registrar usuario ---

function dibujarCasillasNuevo() {
    document.getElementById('nuevoServicios').innerHTML = servicios.map((s) => `
        <label class="flex items-center gap-2 rounded-lg bg-tinta/5 px-3 py-2 text-sm">
            <input type="checkbox" name="nuevoServicio" value="${s.id_servicio}" class="accent-bella-500">
            ${escapar(s.nombre)}
        </label>`).join('');
}

function prepararFormNuevo() {
    const selectRol = document.getElementById('nuevoRol');
    selectRol.addEventListener('change', () => {
        document.getElementById('bloqueServicios').classList.toggle('hidden', selectRol.value !== 'estilista');
        document.getElementById('bloqueProfesion').classList.toggle('hidden', selectRol.value === 'estilista');
    });

    document.getElementById('formNuevo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const alerta = document.getElementById('alertaNuevo');
        const datos = {
            rol: selectRol.value,
            nombre: document.getElementById('nuevoNombre').value.trim(),
            username: document.getElementById('nuevoUsuario').value.trim(),
            password: document.getElementById('nuevoPassword').value
        };
        if (datos.rol === 'estilista') {
            datos.servicios = [...document.querySelectorAll('input[name="nuevoServicio"]:checked')].map((c) => Number(c.value));
        } else {
            datos.profesion = document.getElementById('nuevoProfesion').value.trim();
        }

        const respuesta = await pedir('/register', 'POST', datos);
        if (respuesta.success) {
            mostrarAlerta(alerta, `Cuenta creada. Usuario: ${datos.username} · Contraseña: ${datos.password}`, 'ok');
            e.target.reset();
            selectRol.dispatchEvent(new Event('change'));
            cargarEstilistasAdmin();
            cargarClientasAdmin();
        } else {
            mostrarAlerta(alerta, respuesta.message);
        }
    });
}

// --- Mensajes del chat ---
// Cada 5 segundos se revisa si llegaron mensajes nuevos (polling).

let conversacionAbierta = null;   // id de la conversación que se está leyendo
let ultimoMensajeAdmin = 0;       // id del último mensaje mostrado
let totalSinLeer = 0;
const tituloPanel = document.title;

async function cargarConversaciones() {
    const conversaciones = (await pedir('/conversaciones')).data || [];

    // Notificación: contador en la pestaña, en el título y aviso si llegó algo nuevo
    const sinLeer = conversaciones.reduce((total, c) => total + Number(c.sin_leer), 0);
    if (sinLeer > totalSinLeer) avisar('Tienes mensajes nuevos en el chat');
    totalSinLeer = sinLeer;
    const contador = document.getElementById('contadorMensajes');
    contador.textContent = sinLeer;
    contador.classList.toggle('hidden', sinLeer === 0);
    document.title = sinLeer > 0 ? `(${sinLeer}) Mensajes · BellaStyle` : tituloPanel;

    const lista = document.getElementById('listaConversaciones');
    lista.innerHTML = conversaciones.length === 0
        ? '<li class="p-4 text-sm text-tinta/60">Todavía no hay mensajes.</li>'
        : conversaciones.map((c) => `
            <li>
                <button data-conversacion="${c.id}" class="w-full border-b border-tinta/5 px-4 py-3 text-left transition hover:bg-tinta/5 ${c.id === conversacionAbierta ? 'bg-tinta/10' : ''}">
                    <span class="flex items-center justify-between gap-2">
                        <span class="truncate font-semibold text-tinta">${escapar(c.nombre)}</span>
                        ${Number(c.sin_leer) > 0 ? `<span class="rounded-full bg-bella-700 px-2 text-xs font-bold text-white">${c.sin_leer}</span>` : ''}
                    </span>
                    <span class="mt-1 block truncate text-xs text-tinta/65">${escapar(c.ultimo)}</span>
                    <span class="mt-1 block text-[11px] ${c.estado === 'Abierta' ? 'text-emerald-700' : 'text-tinta/45'}">${c.estado}</span>
                </button>
            </li>`).join('');

    lista.querySelectorAll('button[data-conversacion]').forEach((boton) => {
        boton.addEventListener('click', () => abrirConversacion(Number(boton.dataset.conversacion)));
    });
}

async function abrirConversacion(id) {
    conversacionAbierta = id;
    ultimoMensajeAdmin = 0;
    document.getElementById('mensajesAdmin').innerHTML = '';
    document.getElementById('formResponder').classList.remove('hidden');
    document.getElementById('formResponder').classList.add('flex');
    await cargarMensajesAdmin();
    cargarConversaciones();
    document.getElementById('textoRespuesta').focus();
}

function dibujarMensajeAdmin(m) {
    const delSalon = m.autor !== 'Visitante';
    const quien = m.autor === 'Salon' ? 'Tú (salón)' : m.autor === 'Asistente' ? 'Asistente automático' : 'Visitante';
    const color = m.autor === 'Salon' ? 'bg-bella-200 text-tinta' : m.autor === 'Asistente' ? 'bg-lavanda-100 text-tinta' : 'border border-tinta/10 bg-white/70 text-tinta';
    document.getElementById('mensajesAdmin').insertAdjacentHTML('beforeend', `
        <div class="max-w-[80%] ${delSalon ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] text-tinta/60">${quien} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-sm ${color}">${escapar(m.texto)}</p>
        </div>`);
}

async function cargarMensajesAdmin() {
    if (!conversacionAbierta) return;
    const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/mensajes?desde=${ultimoMensajeAdmin}`);
    if (!respuesta.success) return;

    const c = respuesta.data.conversacion;
    // Botón para cerrar o reabrir (su clic se atiende en prepararChatAdmin)
    const nuevoEstado = c.estado === 'Abierta' ? 'Cerrada' : 'Abierta';
    const textoBoton = c.estado === 'Abierta' ? 'Cerrar conversación' : 'Reabrir';
    document.getElementById('cabeceraConversacion').innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="font-semibold text-tinta">${escapar(c.nombre)}</p>
                <p class="text-xs text-tinta/65">${c.contacto ? escapar(c.contacto) : 'Sin teléfono ni correo'} · ${c.estado}</p>
            </div>
            <button class="btn-mini ${COLORES.gris}" data-estado="${nuevoEstado}">${textoBoton}</button>
        </div>`;

    const caja = document.getElementById('mensajesAdmin');
    respuesta.data.mensajes.forEach((m) => {
        dibujarMensajeAdmin(m);
        ultimoMensajeAdmin = m.id;
    });
    if (respuesta.data.mensajes.length > 0) caja.scrollTop = caja.scrollHeight;
}

function prepararChatAdmin() {
    document.getElementById('formResponder').addEventListener('submit', async (e) => {
        e.preventDefault();
        const campoTexto = document.getElementById('textoRespuesta');
        const texto = campoTexto.value.trim();
        if (!texto || !conversacionAbierta) return;
        const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/responder`, 'POST', { texto });
        if (!respuesta.success) return avisar(respuesta.message);
        campoTexto.value = '';
        await cargarMensajesAdmin();
        cargarConversaciones();
    });
    // Cerrar o reabrir la conversación abierta
    document.getElementById('cabeceraConversacion').addEventListener('click', async (e) => {
        const boton = e.target.closest('button[data-estado]');
        if (!boton) return;
        const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/estado`, 'PUT', { estado: boton.dataset.estado });
        avisar(respuesta.message);
        cargarMensajesAdmin();
        cargarConversaciones();
    });
    cargarConversaciones();
    setInterval(() => { cargarConversaciones(); cargarMensajesAdmin(); }, 5000);
}

function iniciarAdmin() {
    activarPestanas();
    document.getElementById('filtroEstado').addEventListener('change', dibujarCitasAdmin);
    document.getElementById('btnNuevoServicio').addEventListener('click', () => editarServicio(''));
    document.getElementById('btnNuevoProducto').addEventListener('click', () => editarProducto(''));
    cargarCitasAdmin();
    cargarEstilistasAdmin();
    cargarClientasAdmin();
    cargarServiciosAdmin();
    cargarProductosAdmin();
    prepararFormNuevo();
    prepararChatAdmin();
    document.getElementById('btnAgregarVitrinaSalon').addEventListener('click', () => agregarAVitrina(usuario.id, cargarVitrinaSalon));
    cargarVitrinaSalon();
}

// La administradora ve la vitrina completa (suya y de las estilistas) y puede editar o quitar cualquier foto
function cargarVitrinaSalon() {
    dibujarVitrina(document.getElementById('vitrinaSalon'), 'todas', true,
        'Sube fotos del salón, de promociones o de tendencias.');
}

// Funciones que abren ventanas desde los botones "Editar" de las tablas
const EDITORES = {
    reprogramarCita, calificarCita, abrirChatCita, editarServiciosEstilista, editarHorario,
    verAusencias, verOpiniones, editarClienta, editarServicio, editarProducto, fotosServicio,
    verHistorialClienta, editarNotasServicio, fotoProducto
};

// ---------------------------------------------------------------
// PERSONALIZACIÓN: foto de perfil y vitrina de trabajos
// Las imágenes se reducen en el navegador antes de subirlas (reducirImagen)
// y se guardan en la base de datos.
// ---------------------------------------------------------------

// Dirección de la foto de perfil de un usuario. "version" evita que el navegador
// muestre la foto vieja guardada en caché después de cambiarla.
let versionFoto = Date.now();
function fotoDe(idUsuario) {
    return `/api/usuarios/${idUsuario}/foto?v=${versionFoto}`;
}

function mostrarFotoPerfil() {
    document.getElementById('fotoUsuario').src = fotoDe(usuario.id);
    document.getElementById('fotoPerfil').src = fotoDe(usuario.id);
}

async function cambiarFotoPerfil(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    let imagen;
    try { imagen = await reducirImagen(archivo, 500); } catch (err) { return avisar(err.message); }
    const respuesta = await pedir(`/usuarios/${usuario.id}/foto`, 'PUT', { imagen });
    avisar(respuesta.message);
    if (respuesta.success) {
        versionFoto = Date.now();
        mostrarFotoPerfil();
    }
}

async function quitarFotoPerfil() {
    const respuesta = await pedir(`/usuarios/${usuario.id}/foto`, 'DELETE');
    avisar(respuesta.message);
    versionFoto = Date.now();
    mostrarFotoPerfil();
}

// La administradora puede cambiar el nombre con que aparece (por defecto "Admin")
function editarMiNombre() {
    abrirVentana('Nombre que se muestra',
        campo('vMiNombre', 'Nombre', usuario.nombre, 'text', 'maxlength="60" required'),
        async () => {
            const respuesta = await pedir(`/usuarios/${usuario.id}/nombre`, 'PUT', { nombre: valor('vMiNombre') });
            if (respuesta.success) {
                usuario.nombre = respuesta.nombre;
                guardarSesion(usuario);
                document.getElementById('nombreUsuario').textContent = usuario.nombre;
            }
            return respuesta;
        });
}

// Muestra una foto en grande (clic en cualquier parte para cerrar)
function verFotoGrande(url, texto) {
    const visor = document.getElementById('visorFoto');
    document.getElementById('visorImagen').src = url;
    document.getElementById('visorTexto').textContent = texto || '';
    visor.showModal();
}
document.getElementById('visorFoto').addEventListener('click', () => document.getElementById('visorFoto').close());

// Dibuja una vitrina. idUsuario = 'todas' muestra la del salón completa (fotos del salón
// y trabajos de las estilistas). editable = botones "Editar" (descripción) y "Quitar".
async function dibujarVitrina(contenedor, idUsuario, editable, textoVacio) {
    const ruta = idUsuario === 'todas' ? '/vitrina?todas=1' : `/vitrina?idUsuario=${idUsuario}`;
    const fotos = (await pedir(ruta)).data || [];
    const recargar = () => dibujarVitrina(contenedor, idUsuario, editable, textoVacio);
    if (fotos.length === 0) {
        contenedor.innerHTML = `
            <div class="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-bella-200 px-6 py-10 text-center">
                <span class="icono h-12 w-12">${ICONOS.lista}</span>
                <p class="font-semibold text-tinta">Todavía no hay fotos</p>
                <p class="text-sm text-tinta/70">${textoVacio || 'Sube fotos de tus mejores trabajos.'}</p>
            </div>`;
        return;
    }
    contenedor.innerHTML = `<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${fotos.map((f) => {
        const autor = idUsuario === 'todas' ? (f.rol === 'Administradora' ? 'Salón' : f.autor) : '';
        const texto = [f.descripcion, autor].filter(Boolean).join(' · ');
        return `
        <figure class="group relative aspect-square overflow-hidden rounded-2xl bg-tinta/5">
            <button type="button" data-ver="${f.url}" data-texto="${atributo(texto)}" class="h-full w-full" aria-label="Ver en grande">
                <img src="${f.url}" alt="${atributo(f.descripcion || 'Trabajo')}" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
            </button>
            ${texto ? `<figcaption class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white">${escapar(texto)}</figcaption>` : ''}
            ${editable ? `<div class="absolute right-2 top-2 flex gap-1">
                <button type="button" data-editar-vitrina="${f.id_foto}" data-descripcion="${atributo(f.descripcion || '')}" class="btn-mini btn-mini-gris bg-white">Editar</button>
                <button type="button" data-quitar-vitrina="${f.id_foto}" class="btn-mini ${COLORES.rojo} bg-white">Quitar</button>
            </div>` : ''}
        </figure>`;
    }).join('')}</div>`;

    contenedor.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => verFotoGrande(b.dataset.ver, b.dataset.texto)));
    contenedor.querySelectorAll('[data-quitar-vitrina]').forEach((b) => b.addEventListener('click', async () => {
        const respuesta = await pedir(`/vitrina/${b.dataset.quitarVitrina}?idUsuario=${usuario.id}`, 'DELETE');
        avisar(respuesta.message);
        recargar();
    }));
    contenedor.querySelectorAll('[data-editar-vitrina]').forEach((b) => b.addEventListener('click', () => {
        abrirVentana('Editar descripción',
            campo('vDescripcion', 'Descripción', b.dataset.descripcion, 'text', 'maxlength="120" placeholder="Ej: Balayage miel en cabello largo"'),
            async () => {
                const respuesta = await pedir(`/vitrina/${b.dataset.editarVitrina}`, 'PUT', { idUsuario: usuario.id, descripcion: valor('vDescripcion') });
                if (respuesta.success) recargar();
                return respuesta;
            });
    }));
}

// Campo para escoger fotos (con el mismo estilo en todas las ventanas)
function selectorDeFotos(id, etiqueta, varias, ayuda) {
    return `<div class="border-t border-tinta/10 pt-4">
        <label for="${id}" class="etiqueta">${etiqueta}</label>
        <input id="${id}" type="file" accept="image/jpeg,image/png,image/webp" ${varias ? 'multiple' : ''} class="campo file:mr-3 file:rounded-lg file:border-0 file:bg-bella-100 file:px-3 file:py-1.5 file:font-semibold file:text-bella-800">
        <p class="mt-2 text-xs text-tinta/70">${ayuda}</p>
    </div>`;
}

// Reduce y sube varias fotos, una por una. "enviar" recibe la imagen y hace la petición.
// Devuelve el mensaje para mostrar.
async function subirArchivos(archivos, enviar) {
    let subidas = 0;
    for (const archivo of archivos) {
        let imagen;
        try { imagen = await reducirImagen(archivo); } catch (err) { return `${archivo.name}: ${err.message}`; }
        avisar(`Subiendo ${subidas + 1} de ${archivos.length}...`);
        const respuesta = await enviar(imagen);
        if (!respuesta.success) return subidas ? `Se subieron ${subidas}. ${respuesta.message}` : respuesta.message;
        subidas++;
    }
    return subidas === 1 ? 'Foto subida.' : `${subidas} fotos subidas.`;
}

// Ventana para subir fotos a la vitrina: se suben apenas se escogen
function agregarAVitrina(idUsuario, recargar) {
    abrirVentana('Agregar a la vitrina',
        campo('vDescripcion', 'Descripción (opcional, escríbela antes de escoger las fotos)', '', 'text', 'maxlength="120" placeholder="Ej: Balayage miel en cabello largo"') +
        selectorDeFotos('vVitrina', 'Fotos (JPG, PNG o WEBP · máximo 12)', true, 'Se suben apenas las escoges. Luego puedes editar la descripción de cada una.'),
        null);
    document.getElementById('vVitrina').addEventListener('change', async (e) => {
        const descripcion = valor('vDescripcion');
        const mensaje = await subirArchivos([...e.target.files], (imagen) => pedir('/vitrina', 'POST', { idUsuario, imagen, descripcion }));
        cerrarVentana();
        avisar(mensaje);
        recargar();
    });
}

function cargarMiVitrina() {
    dibujarVitrina(document.getElementById('miVitrina'), usuario.id, true,
        'Sube fotos de tus mejores trabajos: aparecen en la vitrina del salón y las clientas las ven al agendar.');
}

// Campo "Profesión" con sugerencias (la estilista lo usa para recomendar: horarios, estilo práctico...)
const PROFESIONES = ['Estudiante', 'Docente', 'Enfermera', 'Médica', 'Abogada', 'Ingeniera', 'Contadora', 'Comerciante',
    'Ama de casa', 'Estilista', 'Secretaria', 'Administradora', 'Policía', 'Deportista', 'Modelo', 'Independiente'];
function campoProfesion(valorActual) {
    return campo('vProfesion', 'Profesión u ocupación (opcional)', valorActual || '', 'text', 'list="listaProfesiones" maxlength="80" placeholder="Ej: Enfermera"') +
        `<datalist id="listaProfesiones">${PROFESIONES.map((p) => `<option value="${p}">`).join('')}</datalist>`;
}

// Botón que abre el comprobante PDF de un servicio finalizado
function botonComprobante(idCita) {
    return `<a href="/api/citas/${idCita}/comprobante" target="_blank" rel="noopener" class="btn-mini ${COLORES.azul}" title="Constancia del servicio prestado">PDF</a>`;
}

// Historial de servicios de una clienta: qué le hicieron, quién y las notas de la estilista
async function verHistorialClienta(idClienta) {
    const datos = (await pedir(`/clientas/${idClienta}/historial`)).data;
    if (!datos) return avisar('No se pudo cargar el historial.');
    const lista = datos.servicios.length === 0
        ? '<p class="text-sm text-tinta/70">Todavía no tiene servicios finalizados. Es su primera visita.</p>'
        : `<ol class="max-h-80 space-y-3 overflow-y-auto">${datos.servicios.map((s, i) => `
            <li class="rounded-xl border border-tinta/10 px-4 py-3 ${i === 0 ? 'bg-bella-50' : ''}">
                <p class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-semibold text-tinta">${escapar(s.servicio)}</span>
                    <span class="text-xs text-tinta/60">${s.fecha} · ${escapar(s.estilista)}</span>
                </p>
                ${i === 0 ? '<p class="text-xs font-semibold text-bella-700">Última visita</p>' : ''}
                <p class="mt-1 text-sm text-tinta/80">${s.notas_servicio ? escapar(s.notas_servicio) : '<span class="text-tinta/50">Sin notas de la estilista</span>'}</p>
                ${usuario.rol === 'Administradora' ? `<button type="button" data-notas-historial="${s.id}" class="btn-mini btn-mini-gris mt-2">Editar notas</button>` : ''}
                ${s.observaciones ? `<p class="mt-1 text-xs text-tinta/60">Pidió: ${escapar(s.observaciones)}</p>` : ''}
                ${s.calificacion ? `<p class="mt-1 text-xs text-oro">${estrellas(s.calificacion)}</p>` : ''}
            </li>`).join('')}</ol>`;
    abrirVentana(`Historial de ${datos.clienta.nombre}`,
        `<p class="text-sm"><span class="text-tinta/60">Profesión:</span> <b>${escapar(datos.clienta.profesion || 'No registrada')}</b></p>` + lista,
        null);
    // Administradora: editar las notas de un servicio desde el historial y volver a él
    document.querySelectorAll('[data-notas-historial]').forEach((b) => b.addEventListener('click', () => {
        const servicio = datos.servicios.find((x) => String(x.id) === b.dataset.notasHistorial);
        abrirVentana(`Notas · ${servicio.servicio} (${servicio.fecha})`,
            `<p class="text-sm text-tinta/70">Atendida por ${escapar(servicio.estilista)}. Puedes corregir o completar lo que se le hizo.</p>
             <div>
                <label for="vNotas" class="etiqueta">Notas</label>
                <textarea id="vNotas" rows="4" maxlength="500" class="campo">${escapar(servicio.notas_servicio || '')}</textarea>
             </div>`,
            async () => {
                const respuesta = await pedir(`/citas/${servicio.id}/notas`, 'PUT', { notas: valor('vNotas') });
                if (respuesta.success) {
                    cargarCitasAdmin();
                    setTimeout(() => verHistorialClienta(idClienta), 50);
                }
                return respuesta;
            });
    }));
}

// La estilista anota lo que hizo (productos, tono, técnica) para la próxima visita.
// La administradora también puede corregirlas o completarlas (por ejemplo, si la estilista ya no está).
function editarNotasServicio(idCita) {
    const lista = usuario.rol === 'Administradora' ? citasAdmin : citasEstilista;
    const c = lista.find((x) => String(x.id) === String(idCita));
    abrirVentana(`Notas del servicio · ${c ? c.cliente : ''}`,
        `<p class="text-sm text-tinta/70">Anota qué le hiciste: productos, tono o técnica. Se verá en el historial de la clienta la próxima vez.</p>
         <div>
            <label for="vNotas" class="etiqueta">Notas</label>
            <textarea id="vNotas" rows="4" maxlength="500" class="campo" placeholder="Ej: Tinte 7.1 rubio ceniza, mascarilla de keratina. Recomendar retoque en 6 semanas.">${escapar(c && c.notas_servicio || '')}</textarea>
         </div>`,
        async () => {
            const respuesta = await pedir(`/citas/${idCita}/notas`, 'PUT', { notas: valor('vNotas') });
            if (respuesta.success) (usuario.rol === 'Administradora' ? cargarCitasAdmin : cargarCitasEstilista)();
            return respuesta;
        });
}

// Foto de un producto: se sube apenas se escoge; se puede cambiar o quitar
function fotoProducto(idProducto) {
    const p = productosAdmin.find((x) => String(x.id_producto) === String(idProducto));
    abrirVentana(`Foto · ${p.nombre}`,
        `<div class="flex items-center gap-4">
            <img src="/api/productos/${idProducto}/foto?v=${versionFoto}" alt="" class="h-32 w-32 rounded-2xl object-cover shadow-sm">
            ${Number(p.tiene_foto) ? `<button type="button" id="btnQuitarFotoProducto" class="btn-mini ${COLORES.rojo}">Quitar foto</button>` : '<p class="text-sm text-tinta/70">Sin foto: se muestra un ícono.</p>'}
         </div>` +
        selectorDeFotos('vFotoProducto', Number(p.tiene_foto) ? 'Cambiar foto' : 'Subir foto', false, 'Se sube apenas la escoges. Usa una foto cuadrada del producto.'),
        null);
    document.getElementById('vFotoProducto').addEventListener('change', async (e) => {
        const mensaje = await subirArchivos([e.target.files[0]], (imagen) => pedir(`/productos/${idProducto}/foto`, 'PUT', { imagen }));
        versionFoto = Date.now();
        cerrarVentana();
        avisar(mensaje);
        cargarProductosAdmin();
    });
    const quitar = document.getElementById('btnQuitarFotoProducto');
    if (quitar) quitar.addEventListener('click', async () => {
        const respuesta = await pedir(`/productos/${idProducto}/foto`, 'DELETE');
        versionFoto = Date.now();
        cerrarVentana();
        avisar(respuesta.message);
        cargarProductosAdmin();
    });
}

// Clienta: tarjetas de las estilistas con su foto, calificación, servicios y vitrina
async function cargarEstilistasClienta() {
    const lista = document.getElementById('listaEstilistasClienta');
    if (estilistas.length === 0) {
        lista.innerHTML = '<p class="text-sm text-tinta/70">Pronto conocerás a nuestro equipo.</p>';
        return;
    }
    const vitrinas = await Promise.all(estilistas.map((e) => pedir(`/vitrina?idUsuario=${e.id_usuario}`)));
    lista.innerHTML = estilistas.map((e, i) => {
        const fotos = (vitrinas[i].data || []).slice(0, 4);
        const trabajos = fotos.length === 0
            ? '<p class="text-xs text-tinta/60">Aún no ha subido fotos de sus trabajos.</p>'
            : `<div class="grid grid-cols-4 gap-2">${fotos.map((f) => `
                <button type="button" data-ver="${f.url}" data-texto="${atributo((f.descripcion ? f.descripcion + ' · ' : '') + e.nombres)}"
                    class="aspect-square overflow-hidden rounded-xl bg-tinta/5" aria-label="Ver trabajo en grande">
                    <img src="${f.url}" alt="" loading="lazy" class="h-full w-full object-cover transition hover:scale-105">
                </button>`).join('')}</div>`;
        return `
            <article class="rounded-2xl border border-tinta/10 bg-white/60 p-4">
                <div class="flex items-center gap-3">
                    <img src="${fotoDe(e.id_usuario)}" alt="" class="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm">
                    <div class="min-w-0 flex-1">
                        <p class="font-titulo text-xl font-bold text-tinta">${escapar(e.nombres + ' ' + e.apellidos)}</p>
                        <p class="truncate text-xs text-tinta/70">${escapar(e.servicios || 'Varios servicios')}</p>
                    </div>
                    <p class="shrink-0 text-sm font-semibold ${e.num_calificaciones ? 'text-amber-600' : 'text-tinta/50'}">${e.num_calificaciones ? `★ ${Number(e.promedio).toFixed(1)}` : 'Nueva'}</p>
                </div>
                <div class="mt-3">${trabajos}</div>
            </article>`;
    }).join('');
    lista.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => verFotoGrande(b.dataset.ver, b.dataset.texto)));
}

// ---------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------

async function iniciar() {
    prepararEncabezado();

    // Catálogos que usan varias secciones
    servicios = (await pedir('/servicios')).data || [];
    estilistas = (await pedir('/estilistas')).data || [];

    if (usuario.rol === 'Clienta') iniciarClienta();
    if (usuario.rol === 'Estilista') iniciarEstilista();
    if (usuario.rol === 'Administradora') iniciarAdmin();
}

if (usuario) iniciar();

// ---------------------------------------------------------------
// Tablas en el celular: cada celda recibe el título de su columna
// (data-label) para mostrarse como tarjeta. Se repite cada vez que
// una tabla cambia, gracias a MutationObserver.
// ---------------------------------------------------------------
function etiquetarTabla(tabla) {
    const titulos = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    tabla.querySelectorAll('tbody tr').forEach((fila) => {
        [...fila.children].forEach((celda, i) => {
            if (!celda.hasAttribute('colspan')) celda.dataset.label = titulos[i] || '';
        });
    });
}

document.querySelectorAll('table.tabla').forEach((tabla) => {
    etiquetarTabla(tabla);
    new MutationObserver(() => etiquetarTabla(tabla)).observe(tabla.querySelector('tbody'), { childList: true });
});
