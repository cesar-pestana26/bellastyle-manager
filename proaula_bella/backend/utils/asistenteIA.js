const config = require('../config/config');
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');
const estilistaModel = require('../models/estilistaModel');

const URL_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const ESPERA_MAXIMA = 20000;
const MAX_HISTORIAL = 12;

function pesos(valor) {
    return '$' + Number(valor).toLocaleString('es-CO');
}

function activo() {
    return Boolean(config.ia.clave) && typeof fetch === 'function';
}

async function armarInstrucciones() {
    const [servicios, productos, estilistas] = await Promise.all([
        servicioModel.listarDisponibles(),
        productoModel.listarActivos(),
        estilistaModel.listarActivas()
    ]);
    const listaServicios = servicios.map((s) => `- ${s.nombre}: ${pesos(s.precio)} (${s.duracion_min} min)`).join('\n');
    const listaProductos = productos.map((p) => `- ${p.nombre}: ${pesos(p.precio)}`).join('\n') || '- (ninguno por ahora)';
    const listaEstilistas = estilistas.map((e) => `- ${e.nombres}: ${e.servicios || 'varios servicios'}`).join('\n');
    const contacto = config.salon || {};

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
Ciudad: Cartagena, Colombia.
Dirección: ${contacto.direccion || '(no registrada)'}
Teléfono o WhatsApp: ${contacto.telefono || '(no registrado)'}
Instagram: ${contacto.instagram || '(no registrado)'}
Horario: lunes a sábado de 8:00 a. m. a 7:00 p. m. Domingos de 8:00 a. m. a 3:00 p. m.
Servicios:
${listaServicios}
Productos a la venta:
${listaProductos}
Estilistas y lo que hacen:
${listaEstilistas}`;
}

function armarConversacion(mensajes) {
    const turnos = [];
    for (const m of mensajes.slice(-MAX_HISTORIAL)) {
        const rol = m.autor === 'Visitante' ? 'user' : 'model';
        const ultimo = turnos[turnos.length - 1];
        if (ultimo && ultimo.role === rol) ultimo.parts[0].text += '\n' + m.texto;
        else turnos.push({ role: rol, parts: [{ text: m.texto }] });
    }
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    return turnos;
}

const MODELO_RESPALDO = 'gemini-flash-lite-latest';

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

async function responder(mensajes) {
    if (!activo()) return null;
    const contents = armarConversacion(mensajes);
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') return null;
    const instrucciones = await armarInstrucciones();

    const modelos = [...new Set([config.ia.modelo, MODELO_RESPALDO])];
    for (const modelo of modelos) {
        let r = await llamarModelo(modelo, instrucciones, contents, true);

        if (r.status === 400 && /instruction|system/i.test(r.error)) {
            r = await llamarModelo(modelo, instrucciones, contents, false);
        }
        if (r.texto) {
            return r.texto.replace(/\*\*?/g, '').replace(/^#+\s*/gm, '').slice(0, 1500);
        }

        console.error(`Gemini (${modelo}) falló [${r.status}]: ${r.error}`);
        if (r.status === 400 && /API key/i.test(r.error)) break;
    }
    return null;
}

module.exports = { responder, activo };
