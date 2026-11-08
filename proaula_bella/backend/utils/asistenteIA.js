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
- Puedes responder CUALQUIER pregunta (cultura general, consejos, dudas del día a día) de forma natural y útil, como una persona amable. Si no tiene que ver con el salón, responde bien y, si viene al caso, ofrece ayuda con una cita.
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

// Modelo de respaldo: si el principal (GEMINI_MODELO) no existe para tu clave o
// falla, se intenta con este. "latest" siempre apunta al Flash-Lite vigente.
const MODELO_RESPALDO = 'gemini-flash-lite-latest';

// Una llamada a un modelo. Devuelve { texto } o { error, status }.
// instruccionesAparte = false: las instrucciones van dentro del primer mensaje
// (algunos modelos Gemma no aceptan "systemInstruction").
async function llamarModelo(modelo, instrucciones, contents, instruccionesAparte) {
    const cuerpo = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } };
    if (instruccionesAparte) {
        cuerpo.systemInstruction = { parts: [{ text: instrucciones }] };
    } else {
        cuerpo.contents = [
            { role: 'user', parts: [{ text: instrucciones + '\n\n(Responde como Bella a partir del siguiente mensaje.)' }] },
            { role: 'model', parts: [{ text: 'Entendido.' }] },
            ...contents
        ];
    }
    const cancelar = new AbortController();
    const reloj = setTimeout(() => cancelar.abort(), ESPERA_MAXIMA);
    try {
        const respuesta = await fetch(`${URL_API}/${modelo}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ia.clave },
            body: JSON.stringify(cuerpo),
            signal: cancelar.signal
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            return { status: respuesta.status, error: datos.error ? datos.error.message : 'sin detalle' };
        }
        // La respuesta viene en partes; se omiten las de "razonamiento" (thought)
        const partes = datos.candidates?.[0]?.content?.parts || [];
        const texto = partes.filter((p) => !p.thought && p.text).map((p) => p.text).join('').trim();
        if (!texto) return { status: 200, error: 'respuesta vacía (' + (datos.candidates?.[0]?.finishReason || 'sin motivo') + ')' };
        return { texto };
    } catch (err) {
        return { status: 0, error: err.name === 'AbortError' ? 'tardó demasiado' : err.message };
    } finally {
        clearTimeout(reloj);
    }
}

// Pide la respuesta. Devuelve el texto, o null si nada funcionó
// (entonces el chat usa el asistente de palabras clave).
async function responder(mensajes) {
    if (!activo()) return null;
    const contents = armarConversacion(mensajes);
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') return null;
    const instrucciones = await armarInstrucciones();

    const modelos = [...new Set([config.ia.modelo, MODELO_RESPALDO])];
    for (const modelo of modelos) {
        let r = await llamarModelo(modelo, instrucciones, contents, true);
        // 400 por las instrucciones: se reintenta poniéndolas dentro del primer mensaje
        if (r.status === 400 && /instruction|system/i.test(r.error)) {
            r = await llamarModelo(modelo, instrucciones, contents, false);
        }
        if (r.texto) {
            // Limpieza: el chat muestra texto simple, sin asteriscos de markdown
            return r.texto.replace(/\*\*?/g, '').replace(/^#+\s*/gm, '').slice(0, 1500);
        }
        // 400 = clave o pedido mal hecho · 403 = clave sin permiso · 404 = modelo no existe · 429 = cupo agotado
        console.error(`Gemini (${modelo}) falló [${r.status}]: ${r.error}`);
        if (r.status === 400 && /API key/i.test(r.error)) break;   // la clave está mal: no sirve probar otro modelo
    }
    return null;
}

module.exports = { responder, activo };
