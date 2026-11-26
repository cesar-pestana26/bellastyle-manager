const crypto = require('crypto');
const chatModel = require('../models/chatModel');
const asistente = require('../utils/asistente');
const asistenteIA = require('../utils/asistenteIA');
const { nombreValido, telefonoValido, emailValido } = require('../utils/validators');

const MAX_TEXTO = 500;
const RE_CODIGO = /^[a-f0-9]{32}$/;

function validarTexto(texto) {
    if (typeof texto !== 'string' || texto.trim() === '') return 'Escribe un mensaje.';
    if (texto.trim().length > MAX_TEXTO) return `El mensaje puede tener máximo ${MAX_TEXTO} caracteres.`;
    return null;
}

function errorServidor(res, err) {
    console.error('Error en el chat:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar el mensaje.' });
}

async function conversacionDelVisitante(req, res) {
    const { codigo } = req.params;
    const conversacion = RE_CODIGO.test(codigo) ? await chatModel.buscarPorCodigo(codigo) : null;
    if (!conversacion) {
        res.status(404).json({ success: false, message: 'La conversación no existe.' });
    }
    return conversacion;
}

async function iniciar(req, res) {
    const { nombre, contacto } = req.body;
    if (!nombreValido(nombre) || nombre.trim().length > 60) {
        return res.status(400).json({ success: false, message: 'Escribe tu nombre (solo letras).' });
    }

    if (contacto && String(contacto).trim() !== '') {
        const texto = String(contacto).trim();
        if (texto.length > 120 || (!telefonoValido(texto) && !emailValido(texto))) {
            return res.status(400).json({ success: false, message: 'Escribe un celular de 10 dígitos (empieza por 3) o un correo válido.' });
        }
    }
    try {
        const codigo = crypto.randomBytes(16).toString('hex');
        const primerNombre = nombre.trim().split(/\s+/)[0];
        const id = await chatModel.crearConversacion({ codigo, nombre: nombre.trim(), contacto: contacto && String(contacto).trim() });
        const saludo = asistenteIA.activo()
            ? `¡Hola, ${primerNombre}! Soy Bella, la asistente virtual de BellaStyle 💖 Pregúntame lo que quieras: precios, servicios, horarios, consejos de belleza o cómo agendar tu cita.`
            : `¡Hola, ${primerNombre}! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar. Si necesitas algo más, una asesora te responde por aquí.`;
        await chatModel.agregarMensaje(id, 'Asistente', saludo);
        res.status(201).json({ success: true, data: { codigo } });
    } catch (err) {
        errorServidor(res, err);
    }
}

async function verMensajes(req, res) {
    try {
        const conversacion = await conversacionDelVisitante(req, res);
        if (!conversacion) return;
        const desde = Number(req.query.desde) || 0;
        const mensajes = await chatModel.mensajesDesde(conversacion.id_conversacion, desde);
        res.json({ success: true, data: { nombre: conversacion.nombre, mensajes } });
    } catch (err) {
        errorServidor(res, err);
    }
}

async function responderAlVisitante(idConversacion, texto) {
    let respuesta = null;
    if (asistenteIA.activo()) {
        respuesta = await asistenteIA.responder(await chatModel.mensajesDesde(idConversacion, 0));
    }
    if (!respuesta) {
        respuesta = await asistente.responder(texto, await chatModel.ultimoDelAsistente(idConversacion));
    }
    if (respuesta) await chatModel.agregarMensaje(idConversacion, 'Asistente', respuesta);
}

async function enviarVisitante(req, res) {
    const error = validarTexto(req.body.texto);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const conversacion = await conversacionDelVisitante(req, res);
        if (!conversacion) return;
        const id = conversacion.id_conversacion;
        await chatModel.agregarMensaje(id, 'Visitante', req.body.texto.trim());

        const asistenteResponde = !(await chatModel.salonYaRespondio(id));
        res.status(201).json({ success: true, data: { asistenteResponde } });

        if (asistenteResponde) {
            responderAlVisitante(id, req.body.texto.trim())
                .catch((err) => console.error('Error del asistente:', err.message));
        }
    } catch (err) {
        errorServidor(res, err);
    }
}

async function listar(req, res) {
    try {
        res.json({ success: true, data: await chatModel.listarConversaciones() });
    } catch (err) {
        errorServidor(res, err);
    }
}

async function abrir(req, res) {
    try {
        const conversacion = await chatModel.buscarPorId(req.params.id);
        if (!conversacion) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        await chatModel.marcarLeidos(conversacion.id_conversacion);
        const mensajes = await chatModel.mensajesDesde(conversacion.id_conversacion, Number(req.query.desde) || 0);
        res.json({ success: true, data: { conversacion, mensajes } });
    } catch (err) {
        errorServidor(res, err);
    }
}

async function responder(req, res) {
    const error = validarTexto(req.body.texto);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const conversacion = await chatModel.buscarPorId(req.params.id);
        if (!conversacion) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        await chatModel.agregarMensaje(conversacion.id_conversacion, 'Salon', req.body.texto.trim());
        res.status(201).json({ success: true, message: 'Respuesta enviada.' });
    } catch (err) {
        errorServidor(res, err);
    }
}

async function cambiarEstado(req, res) {
    const { estado } = req.body;
    if (!['Abierta', 'Cerrada'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const cambiado = await chatModel.cambiarEstado(req.params.id, estado);
        if (!cambiado) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        res.json({ success: true, message: `Conversación ${estado.toLowerCase()}.` });
    } catch (err) {
        errorServidor(res, err);
    }
}

module.exports = { iniciar, verMensajes, enviarVisitante, listar, abrir, responder, cambiarEstado };
