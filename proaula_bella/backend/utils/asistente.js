const config = require('../config/config');
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');

const AVISO_ASESORA = 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.';

function pesos(valor) {
    return '$' + Number(valor).toLocaleString('es-CO');
}

function normalizar(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9ñ ]/g, ' ');
}

const REGLAS = [
    {
        palabras: ['precio', 'precios', 'cuesta', 'cuestan', 'costo', 'valor', 'vale', 'cuanto', 'cotizacion', 'cotizar'],
        responder: async () => {
            const servicios = await servicioModel.listarDisponibles();
            const lista = servicios.map((s) => `• ${s.nombre}: ${pesos(s.precio)}`).join('\n');
            return `Estos son nuestros precios:\n${lista}\nSi necesitas una cotización especial, una asesora te responderá por aquí.`;
        }
    },
    {
        palabras: ['horario', 'horarios', 'abren', 'abierto', 'cierran', 'atienden'],
        responder: async () => 'Atendemos de lunes a sábado de 8:00 a. m. a 7:00 p. m., y los domingos de 8:00 a. m. a 3:00 p. m.'
    },
    {
        palabras: ['cita', 'citas', 'agendar', 'agenda', 'reservar', 'reserva', 'turno', 'apartar'],
        responder: async () => 'Para agendar: crea tu cuenta en "Crear cuenta", entra a tu panel, escoge el servicio, la fecha y la hora y pulsa "Agendar". El sistema te asigna una estilista libre.'
    },
    {
        palabras: ['servicio', 'servicios', 'hacen', 'ofrecen', 'tratamientos'],
        responder: async () => {
            const servicios = await servicioModel.listarDisponibles();
            const lista = servicios.map((s) => `• ${s.nombre} (${s.duracion_min} min)`).join('\n');
            return `Ofrecemos estos servicios:\n${lista}\nSi buscas algo que no está en la lista, una asesora te responderá por aquí.`;
        }
    },
    {
        palabras: ['direccion', 'ubicacion', 'ubicados', 'ubicadas', 'queda', 'quedan', 'telefono', 'celular', 'whatsapp', 'instagram', 'contacto'],
        responder: async () => {
            const s = config.salon || {};
            const datos = [];
            if (s.direccion) datos.push(`Dirección: ${s.direccion}, Cartagena.`);
            if (s.telefono) datos.push(`Teléfono o WhatsApp: ${s.telefono}.`);
            if (s.instagram) datos.push(`Instagram: ${s.instagram}.`);
            if (datos.length === 0) return 'Estamos en Cartagena. Una asesora del salón te dará la dirección y el contacto por este mismo chat.';
            return datos.join('\n');
        }
    },
    {
        palabras: ['producto', 'productos', 'venden', 'shampoo', 'esmalte'],
        responder: async () => {
            const productos = await productoModel.listarActivos();
            const lista = productos.map((p) => `• ${p.nombre}: ${pesos(p.precio)}`).join('\n');
            return `Tenemos estos productos:\n${lista}`;
        }
    }
];

async function responder(texto, ultimoAviso) {
    const palabras = normalizar(texto).split(/\s+/);
    for (const regla of REGLAS) {
        if (regla.palabras.some((p) => palabras.includes(p))) {
            return await regla.responder();
        }
    }

    return ultimoAviso === AVISO_ASESORA ? null : AVISO_ASESORA;
}

module.exports = { responder, AVISO_ASESORA };
