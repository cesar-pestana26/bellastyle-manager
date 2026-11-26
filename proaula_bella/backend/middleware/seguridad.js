const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/config');

const ADMIN = 'Administradora';

function crearToken(usuario) {
    return jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, config.jwt.secreto, { expiresIn: config.jwt.duracion });
}

function leerToken(req) {
    const encabezado = req.headers.authorization || '';
    if (encabezado.startsWith('Bearer ')) return encabezado.slice(7);
    return typeof req.query.token === 'string' ? req.query.token : null;
}

function requiereSesion(req, res, next) {
    const token = leerToken(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Inicia sesión para continuar.' });
    }
    try {
        const datos = jwt.verify(token, config.jwt.secreto);
        req.usuario = { id: datos.id, rol: datos.rol };
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    }

    req.body = req.body || {};
    req.body.idUsuario = req.usuario.id;
    req.body.rol = req.usuario.rol;
    req.query.idUsuario = String(req.usuario.id);
    req.query.rol = req.usuario.rol;
    next();
}

function soloRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto.' });
        }
        next();
    };
}

function sinPermiso(res, mensaje) {
    return res.status(403).json({ success: false, message: mensaje || 'No tienes permiso para hacer esto.' });
}

function duenoDeCita(leerId = (req) => req.params.id) {
    return async (req, res, next) => {
        if (req.usuario.rol === ADMIN) return next();
        try {
            const [filas] = await db.query(`
                SELECT cl.id_usuario AS clienta, e.id_usuario AS estilista
                FROM citas c
                JOIN clientas cl ON cl.id_clienta = c.id_cliente
                JOIN estilistas e ON e.id_estilista = c.id_estilista
                WHERE c.id_cita = ?`, [Number(leerId(req)) || 0]);
            if (filas.length === 0) return res.status(404).json({ success: false, message: 'La cita no existe.' });
            const dueno = req.usuario.rol === 'Clienta' ? filas[0].clienta : filas[0].estilista;
            if (dueno !== req.usuario.id) return sinPermiso(res, 'Esta cita no te pertenece.');
            next();
        } catch (err) { next(err); }
    };
}

function mismaCuenta(param = 'id') {
    return (req, res, next) => {
        if (req.usuario.rol === ADMIN || Number(req.params[param]) === req.usuario.id) return next();
        sinPermiso(res, 'Solo puedes cambiar tu propia cuenta.');
    };
}

async function mismaEstilista(req, res, next) {
    if (req.usuario.rol === ADMIN) return next();
    try {
        const [filas] = await db.query('SELECT id_usuario FROM estilistas WHERE id_estilista = ?', [req.params.id]);
        if (filas.length && filas[0].id_usuario === req.usuario.id) return next();
        sinPermiso(res, 'Solo puedes cambiar tu propio horario.');
    } catch (err) { next(err); }
}

async function duenaDeAusencia(req, res, next) {
    if (req.usuario.rol === ADMIN) return next();
    try {
        const [filas] = await db.query(`
            SELECT e.id_usuario FROM ausencias a JOIN estilistas e ON e.id_estilista = a.id_estilista
            WHERE a.id_ausencia = ?`, [req.params.id]);
        if (filas.length && filas[0].id_usuario === req.usuario.id) return next();
        sinPermiso(res, 'Solo puedes quitar tus propias ausencias.');
    } catch (err) { next(err); }
}

function mismaClienta({ permitirPersonal = false } = {}) {
    return async (req, res, next) => {
        if (req.usuario.rol === ADMIN || (permitirPersonal && req.usuario.rol === 'Estilista')) return next();
        try {
            const [filas] = await db.query('SELECT id_usuario FROM clientas WHERE id_clienta = ?', [req.params.id]);
            if (filas.length && filas[0].id_usuario === req.usuario.id) return next();
            sinPermiso(res, 'Solo puedes ver o cambiar tus propios datos.');
        } catch (err) { next(err); }
    };
}

const MAX_INTENTOS = 3;
const BLOQUEO_MS = 3 * 60 * 1000;
const intentos = new Map();

function minutosBloqueado(clave) {
    const registro = intentos.get(clave);
    if (!registro || !registro.hasta) return 0;
    const falta = registro.hasta - Date.now();
    if (falta <= 0) { intentos.delete(clave); return 0; }
    return Math.ceil(falta / 60000);
}

function registrarFallo(clave) {
    const registro = intentos.get(clave) || { fallos: 0, hasta: 0 };
    registro.fallos += 1;
    if (registro.fallos >= MAX_INTENTOS) {
        registro.hasta = Date.now() + BLOQUEO_MS;
        registro.fallos = 0;
    }
    intentos.set(clave, registro);
    return registro.hasta ? 0 : MAX_INTENTOS - registro.fallos;
}

function limpiarIntentos(clave) {
    intentos.delete(clave);
}

module.exports = {
    crearToken, requiereSesion, soloRoles,
    duenoDeCita, mismaCuenta, mismaEstilista, duenaDeAusencia, mismaClienta,
    minutosBloqueado, registrarFallo, limpiarIntentos, MAX_INTENTOS
};
