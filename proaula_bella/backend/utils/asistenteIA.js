// Asistente con inteligencia artificial (Gemini API de Google).
// Responde como una persona, con los datos REALES del salón sacados de MySQL.
//
// Cómo funciona:
//   1. Se arma un "contexto" con servicios, precios, productos, estilistas y horario.
//   2. Se envía a Gemini junto con la conversación (solo los mensajes, nunca el
//      teléfono ni el correo del visitante).
//   3. Gemini devuelve la respuesta en texto.
// Si no hay clave, se acaba el cupo o Gemini falla, devuelve null y el chat usa
// el asistente de palabras clave (utils/asistente.js). Así el chat nunca queda mudo.

const config = require('../config/config');
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');
const estilistaModel = require('../models/estilistaModel');

const URL_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const ESPERA_MAXIMA = 20000;   // si Gemini tarda más de 20 s, se cancela
const MAX_HISTORIAL = 12;      // mensajes anteriores que se le envían

function pesos(valor) {
    return '$' + Number(valor).toLocaleString('es-CO');
}

// ¿Está configurada la clave? (variable de entorno GEMINI_API_KEY)
function activo() {
    return Boolean(config.ia.clave) && typeof fetch === 'function';
}

// Instrucciones + datos actuales del salón (se consultan en cada mensaje,
// así si la administradora cambia un precio, el asistente ya lo sabe)
async function armarInstrucciones() {
    const [servicios, productos, estilistas] = await Promise.all([
        servicioModel.listarDisponibles(),
        productoModel.listarActivos(),
        estilistaModel.listarActivas()
    ]);
    const listaServicios = servicios.map((s) => `- ${s.nombre}: ${pesos(s.precio)} (${s.duracion_min} min)`).join('\n');
    const listaProductos = productos.map((p) => `- ${p.nombre}: ${pesos(p.precio)}`).join('\n') || '- (ninguno por ahora)';
    const listaEstilistas = estilistas.map((e) => `- ${e.nombres}: ${e.servicios || 'varios servicios'}`).join('\n');

    return `Eres "Bella", la asistente virtual de BellaStyle, un salón de belleza en Cartagena, Colombia.
Hablas con visitantes de la página web. Responde en español, con calidez y naturalidad, como una recepcionista amable.

REGLAS:
- Respuestas cortas: de 1 a 4 frases. Texto simple, sin markdown, sin asteriscos ni títulos. Puedes usar algún emoji con moderación.
- Usa SOLO los datos del salón que están abajo. Nunca inventes precios, servicios, productos, promociones ni horarios.
- Si algo no está en los datos (por ejemplo, servicio a domicilio, descuentos o un precio especial), dilo con amabilidad y explica que una asesora del salón le responderá por este mismo chat.
- Puedes dar consejos generales de belleza (cuidado del cabello, uñas, piel) y recomendar el servicio adecuado.
- Si preguntan algo que no tiene que ver con belleza ni con el salón, responde brevemente con amabilidad y vuelve al tema del salón.
- No pidas datos personales (cédula, tarjetas, direcciones). No des diagnósticos médicos.
- Para agendar: la persona crea su cuenta con el botón "Crear cuenta", entra a su panel, escoge servicio, fecha y una hora libre, y pulsa "Agendar". El sistema le asigna una estilista disponible y se abre un chat con ella.

DATOS DEL SALÓN:
Horario: lunes a sábado de 8:00 a. m. a 7:00 p. m. Los domingos no se atiende.
Servicios:
${listaServicios}
Productos a la venta:
${listaProductos}
Estilistas y lo que hacen:
${listaEstilistas}`;
}

// Convierte los mensajes guardados al formato de Gemini:
// Visitante -> "user", Asistente/Salón -> "model". Gemini exige que se alternen
// y que el primero y el último sean del usuario.
function armarConversacion(mensajes) {
    const turnos = [];
    for (const m of mensajes.slice(-MAX_HISTORIAL)) {
        const rol = m.autor === 'Visitante' ? 'user' : 'model';
        const ultimo = turnos[turnos.length - 1];
        if (ultimo && ultimo.role === rol) ultimo.parts[0].text += '\n' + m.texto;   // une seguidos del mismo autor
        else turnos.push({ role: rol, parts: [{ text: m.texto }] });
    }
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    return turnos;
}

// Pide la respuesta a Gemini. Devuelve el texto, o null si algo falla.
async function responder(mensajes) {
    if (!activo()) return null;
    const contents = armarConversacion(mensajes);
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') return null;

    const cancelar = new AbortController();
    const reloj = setTimeout(() => cancelar.abort(), ESPERA_MAXIMA);
    try {
        const respuesta = await fetch(`${URL_API}/${config.ia.modelo}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ia.clave },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: await armarInstrucciones() }] },
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
            }),
            signal: cancelar.signal
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            // 429 = se acabó el cupo gratis; 400/403 = clave o modelo mal escritos
            console.error(`Gemini respondió ${respuesta.status}:`, datos.error ? datos.error.message : '');
            return null;
        }
        // La respuesta viene en partes; se omiten las de "razonamiento" (thought)
        const partes = datos.candidates?.[0]?.content?.parts || [];
        const texto = partes.filter((p) => !p.thought && p.text).map((p) => p.text).join('').trim();
        if (!texto) return null;
        // Limpieza: el chat muestra texto simple, sin asteriscos de markdown
        return texto.replace(/\*\*?/g, '').replace(/^#+\s*/gm, '').slice(0, 1500);
    } catch (err) {
        console.error('No se pudo usar Gemini:', err.name === 'AbortError' ? 'tardó demasiado' : err.message);
        return null;
    } finally {
        clearTimeout(reloj);
    }
}

module.exports = { responder, activo };
