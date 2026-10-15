// Chat de la página de inicio (welcome.html).
// El visitante escribe sin crear cuenta. El código de su conversación se guarda
// en el navegador (localStorage) para que, si vuelve, siga viendo sus mensajes.
// Cada pocos segundos se pregunta al servidor si hay mensajes nuevos (polling).

const chat = {
    codigo: localStorage.getItem('bellaChat'),
    ultimoId: 0,          // id del último mensaje mostrado
    sinLeer: 0,           // respuestas que llegaron con el chat cerrado
    abierto: false,
    temporizador: null
};
const tituloOriginal = document.title;

const burbuja = document.getElementById('chatBurbuja');
const ventanaChat = document.getElementById('chatVentana');
const listaMensajes = document.getElementById('chatMensajes');
const contador = document.getElementById('chatContador');

// --- Mostrar mensajes ---

function dibujarMensaje(m) {
    const propio = m.autor === 'Visitante';
    const quien = m.autor === 'Salon' ? 'Asesora BellaStyle' : m.autor === 'Asistente' ? 'Asistente' : 'Tú';
    const burbujaTexto = propio
        ? 'ml-auto bg-bella-500 text-white rounded-br-sm'
        : m.autor === 'Salon'
            ? 'bg-oro/15 text-white rounded-bl-sm border border-oro/30'
            : 'bg-white/10 text-white/90 rounded-bl-sm';
    listaMensajes.insertAdjacentHTML('beforeend', `
        <div class="max-w-[85%] ${propio ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] text-white/40">${quien} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-sm ${burbujaTexto}">${escapar(m.texto)}</p>
        </div>`);
}

function actualizarContador() {
    contador.textContent = chat.sinLeer;
    contador.classList.toggle('hidden', chat.sinLeer === 0);
    document.title = chat.sinLeer > 0 ? `(${chat.sinLeer}) Nuevo mensaje · BellaStyle` : tituloOriginal;
}

// --- Pedir mensajes nuevos al servidor ---

async function buscarMensajes() {
    if (!chat.codigo) return;
    const respuesta = await pedir(`/chat/${chat.codigo}?desde=${chat.ultimoId}`);
    if (!respuesta.success) {
        // La conversación ya no existe (por ejemplo, se reinstaló la base de datos)
        if (respuesta.message === 'La conversación no existe.') reiniciarChat();
        return;
    }
    const nuevos = respuesta.data.mensajes;
    const primeraCarga = chat.ultimoId === 0;   // al abrir la página no se cuentan como nuevos
    nuevos.forEach((m) => {
        dibujarMensaje(m);
        // Notificación: respuestas que llegan con el chat cerrado o la pestaña oculta
        if (m.autor !== 'Visitante' && !primeraCarga && (!chat.abierto || document.hidden)) chat.sinLeer++;
        chat.ultimoId = m.id;
    });
    if (nuevos.length > 0) {
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        actualizarContador();
    }
}

// Abierto: revisa cada 3 segundos. Cerrado: cada 10 (solo para el contador).
function programarRevision() {
    clearInterval(chat.temporizador);
    if (!chat.codigo) return;
    chat.temporizador = setInterval(buscarMensajes, chat.abierto ? 3000 : 10000);
}

// --- Pantallas del chat: datos del visitante o conversación ---

function mostrarConversacion(visible) {
    document.getElementById('chatDatos').classList.toggle('hidden', visible);
    document.getElementById('chatConversacion').classList.toggle('hidden', !visible);
    document.getElementById('chatConversacion').classList.toggle('flex', visible);
}

function reiniciarChat() {
    localStorage.removeItem('bellaChat');
    chat.codigo = null;
    chat.ultimoId = 0;
    listaMensajes.innerHTML = '';
    mostrarConversacion(false);
    programarRevision();
}

function abrirChat(abrir) {
    chat.abierto = abrir;
    ventanaChat.classList.toggle('hidden', !abrir);
    ventanaChat.classList.toggle('flex', abrir);
    if (abrir) {
        chat.sinLeer = 0;
        actualizarContador();
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        (chat.codigo ? document.getElementById('chatTexto') : document.getElementById('chatNombre')).focus();
    }
    programarRevision();
}

burbuja.addEventListener('click', () => abrirChat(!chat.abierto));
document.getElementById('chatCerrar').addEventListener('click', () => abrirChat(false));
document.addEventListener('visibilitychange', () => { if (!document.hidden && chat.abierto) { chat.sinLeer = 0; actualizarContador(); } });

// Paso 1: el visitante escribe su nombre (y si quiere, teléfono o correo)
document.getElementById('chatDatos').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('chatAlerta');
    const respuesta = await pedir('/chat', 'POST', {
        nombre: document.getElementById('chatNombre').value,
        contacto: document.getElementById('chatContacto').value
    });
    if (!respuesta.success) return mostrarAlerta(alerta, respuesta.message);
    ocultarAlerta(alerta);
    chat.codigo = respuesta.data.codigo;
    localStorage.setItem('bellaChat', chat.codigo);
    mostrarConversacion(true);
    await buscarMensajes();
    programarRevision();
    document.getElementById('chatTexto').focus();
});

// Paso 2: enviar mensajes
document.getElementById('chatFormMensaje').addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoTexto = document.getElementById('chatTexto');
    const texto = campoTexto.value.trim();
    if (!texto) return;
    campoTexto.value = '';
    const respuesta = await pedir(`/chat/${chat.codigo}/mensajes`, 'POST', { texto });
    if (!respuesta.success) {
        campoTexto.value = texto;
        return mostrarAlerta(document.getElementById('chatAlertaMensaje'), respuesta.message);
    }
    ocultarAlerta(document.getElementById('chatAlertaMensaje'));
    await buscarMensajes();
});

// Al cargar la página: si el visitante ya tenía conversación, se recupera
if (chat.codigo) {
    mostrarConversacion(true);
    buscarMensajes();
}
programarRevision();
