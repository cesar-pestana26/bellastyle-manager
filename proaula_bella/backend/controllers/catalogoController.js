const servicioModel = require('../models/servicioModel');
const estilistaModel = require('../models/estilistaModel');
const clienteModel = require('../models/clienteModel');
const productoModel = require('../models/productoModel');

function responderLista(consultaActivos, consultaTodos = consultaActivos) {
    return async (req, res) => {
        try {
            const datos = req.query.todos ? await consultaTodos() : await consultaActivos();
            res.json({ success: true, data: datos });
        } catch (err) {
            console.error('Error en catálogo:', err.message);
            res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
        }
    };
}

async function estilistaPorUsuario(req, res) {
    try {
        const estilista = await estilistaModel.buscarPorUsuario(req.params.idUsuario);
        if (!estilista) return res.status(404).json({ success: false, message: 'No se encontró el perfil.' });
        res.json({ success: true, data: estilista });
    } catch (err) {
        console.error('Error en catálogo:', err.message);
        res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
    }
}

async function clientaPorUsuario(req, res) {
    try {
        const clienta = await clienteModel.buscarPorUsuario(req.params.idUsuario);
        if (!clienta) return res.status(404).json({ success: false, message: 'No se encontró el perfil.' });
        res.json({ success: true, data: clienta });
    } catch (err) {
        console.error('Error en catálogo:', err.message);
        res.status(500).json({ success: false, message: 'Error al consultar la base de datos.' });
    }
}

module.exports = {
    servicios: responderLista(servicioModel.listarDisponibles, servicioModel.listarTodos),
    estilistas: responderLista(estilistaModel.listarActivas, estilistaModel.listarTodas),
    clientas: responderLista(clienteModel.listar),
    productos: responderLista(productoModel.listarActivos, productoModel.listarTodos),
    estilistaPorUsuario,
    clientaPorUsuario
};
