// Lista de rutas (endpoints) de la API.
// Cada ruta llama a una función de un controlador.
const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const citas = require('../controllers/citasController');
const catalogo = require('../controllers/catalogoController');
const gestion = require('../controllers/gestionController');
const chat = require('../controllers/chatController');
const horarios = require('../controllers/horarioController');
const calificaciones = require('../controllers/calificacionController');
const chatCita = require('../controllers/chatCitaController');
const fotos = require('../controllers/fotoServicioController');
const perfil = require('../controllers/perfilController');
const comprobantes = require('../controllers/comprobanteController');
const pagos = require('../controllers/pagoController');
const pedidos = require('../controllers/pedidoController');
const {
    requiereSesion, soloRoles, duenoDeCita, mismaCuenta, mismaEstilista, duenaDeAusencia, mismaClienta
} = require('../middleware/seguridad');

// Atajos para leer las rutas más fácil:
// sesion = hay que haber iniciado sesión (token válido)
// admin  = solo la administradora
// personal = estilista o administradora
const sesion = requiereSesion;
const admin = [requiereSesion, soloRoles('Administradora')];
const personal = [requiereSesion, soloRoles('Estilista', 'Administradora')];
const cita = duenoDeCita();

// ---------------------------------------------------------------
// RUTAS PÚBLICAS (sin iniciar sesión): login, registro, catálogo,
// fotos (las etiquetas <img> no pueden mandar token) y el chat del visitante.
// ---------------------------------------------------------------
router.post('/login', auth.login);
router.post('/register', auth.registrar);
router.post('/recuperar-password', auth.recuperarPassword);

router.get('/servicios', catalogo.servicios);
router.get('/productos', catalogo.productos);
router.get('/estilistas', catalogo.estilistas);
router.get('/estilistas/:id/calificaciones', calificaciones.deEstilista);
router.get('/estilistas/:id/horario', horarios.obtener);
router.get('/disponibilidad', citas.disponibilidad);

router.get('/fotos-servicios', fotos.listar);
router.get('/servicios/:id/fotos', fotos.listar);
router.get('/fotos/:id', fotos.ver);
router.get('/usuarios/:id/foto', perfil.verFoto);
router.get('/vitrina', perfil.listarVitrina);
router.get('/vitrina/:id/imagen', perfil.verImagenVitrina);
router.get('/productos/:id/foto', perfil.verFotoProducto);

// Chat de la página de inicio (visitante sin cuenta)
router.post('/chat', chat.iniciar);
router.get('/chat/:codigo', chat.verMensajes);
router.post('/chat/:codigo/mensajes', chat.enviarVisitante);

// ---------------------------------------------------------------
// RUTAS CON SESIÓN: cada una dice quién puede usarla.
// ---------------------------------------------------------------

// Citas: cada quien ve solo las suyas (el filtro sale del token)
router.get('/citas', sesion, citas.listar);
router.post('/citas', sesion, soloRoles('Clienta'), citas.crear);
router.put('/citas/:id/estado', sesion, cita, citas.cambiarEstado);
router.put('/citas/:id/reprogramar', sesion, cita, citas.reprogramar);
router.post('/citas/:id/calificacion', sesion, soloRoles('Clienta'), cita, calificaciones.calificar);
router.get('/citas/:id/mensajes', sesion, cita, chatCita.verMensajes);
router.post('/citas/:id/mensajes', sesion, cita, chatCita.enviar);
router.put('/citas/:id/notas', personal, cita, citas.guardarNotas);
router.get('/citas/:id/comprobante', sesion, cita, comprobantes.comprobante);

// Datos de cada cuenta: solo la propia (o la administradora)
router.put('/usuarios/:id/foto', sesion, mismaCuenta(), perfil.cambiarFoto);
router.delete('/usuarios/:id/foto', sesion, mismaCuenta(), perfil.quitarFoto);
router.put('/usuarios/:id/nombre', sesion, mismaCuenta(), perfil.cambiarNombre);
router.get('/estilistas/usuario/:idUsuario', sesion, mismaCuenta('idUsuario'), catalogo.estilistaPorUsuario);
router.get('/clientas/usuario/:idUsuario', sesion, mismaCuenta('idUsuario'), catalogo.clientaPorUsuario);
router.put('/clientas/:id', sesion, mismaClienta(), gestion.editarClienta);
router.get('/clientas/:id/historial', sesion, mismaClienta({ permitirPersonal: true }), citas.historialClienta);

// Vitrina: el controlador revisa que la foto sea de quien inició sesión
router.post('/vitrina', personal, perfil.agregarVitrina);
router.put('/vitrina/:id', personal, perfil.editarVitrina);
router.delete('/vitrina/:id', personal, perfil.eliminarVitrina);

// Horario y ausencias: la propia estilista o la administradora
router.put('/estilistas/:id/horario', personal, mismaEstilista, horarios.guardar);
router.post('/estilistas/:id/ausencias', personal, mismaEstilista, horarios.crearAusencia);
router.delete('/ausencias/:id', personal, duenaDeAusencia, horarios.eliminarAusencia);

// Pagos: la clienta paga sus citas; la administradora ve todos y cambia el estado
router.get('/pagos', sesion, pagos.listar);
router.get('/pagos/cita/:idCita', sesion, duenoDeCita((req) => req.params.idCita), pagos.porCita);
router.post('/pagos', sesion, soloRoles('Clienta', 'Administradora'), duenoDeCita((req) => req.body.idCita || req.body.id_cita), pagos.crear);
router.put('/pagos/:id/estado', admin, pagos.cambiarEstado);

// Pedidos de la tienda: la clienta compra y ve los suyos; la administradora los gestiona
router.get('/pedidos', sesion, pedidos.listar);
router.post('/pedidos', sesion, soloRoles('Clienta'), pedidos.crear);
router.put('/pedidos/:id/estado', admin, pedidos.cambiarEstado);

// ---------------------------------------------------------------
// SOLO ADMINISTRADORA
// ---------------------------------------------------------------
router.post('/servicios', admin, gestion.crearServicio);
router.put('/servicios/:id', admin, gestion.editarServicio);
router.put('/servicios/:id/estado', admin, gestion.estadoServicio);
router.post('/servicios/:id/fotos', admin, fotos.subir);
router.delete('/fotos/:id', admin, fotos.eliminar);

router.post('/productos', admin, gestion.crearProducto);
router.put('/productos/:id', admin, gestion.editarProducto);
router.put('/productos/:id/estado', admin, gestion.estadoProducto);
router.put('/productos/:id/foto', admin, perfil.cambiarFotoProducto);
router.delete('/productos/:id/foto', admin, perfil.quitarFotoProducto);

router.put('/estilistas/:id/estado', admin, gestion.estadoEstilista);
router.put('/estilistas/:id/servicios', admin, gestion.serviciosEstilista);
router.get('/clientas', admin, catalogo.clientas);

// Pestaña Mensajes (chat con visitantes)
router.get('/conversaciones', admin, chat.listar);
router.get('/conversaciones/:id/mensajes', admin, chat.abrir);
router.post('/conversaciones/:id/responder', admin, chat.responder);
router.put('/conversaciones/:id/estado', admin, chat.cambiarEstado);

module.exports = router;
