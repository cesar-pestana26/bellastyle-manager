// Servidor principal de BellaStyle Manager
const express = require('express');
const path = require('path');
const config = require('./config/config');
const db = require('./config/db');
const rutas = require('./routes/rutas');

const app = express();

// Permite leer JSON en el cuerpo de las peticiones
// Límite de 3 MB: alcanza para las fotos de los servicios (van en base64)
app.use(express.json({ limit: '3mb' }));

// La dirección principal (http://localhost:3000) abre el inicio de sesión
app.get('/', (req, res) => res.redirect('/index.html'));

// Sirve las páginas del frontend (index.html, panel.html, etc.)
// "no-cache": el navegador puede guardar los archivos, pero siempre pregunta si cambiaron.
// Así, después de actualizar el código, nadie ve una versión vieja de las páginas.
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, ruta) => {
        if (/\.(html|js|css)$/.test(ruta)) res.setHeader('Cache-Control', 'no-cache');
    }
}));

// Todas las rutas de la API empiezan por /api
app.use('/api', rutas);

// Revisa que la base de datos sea la versión actual (contraseñas cifradas).
// Si es la versión vieja, el login no funcionaría.
async function revisarBaseDeDatos() {
    const [columnas] = await db.query("SHOW COLUMNS FROM citas LIKE 'precio'");
    const [chat] = await db.query("SHOW TABLES LIKE 'mensajes'");
    const [horarios] = await db.query("SHOW TABLES LIKE 'horarios'");
    const [fotos] = await db.query("SHOW COLUMNS FROM citas LIKE 'reprogramaciones'");
    const [usuarios] = await db.query('SELECT password FROM usuarios LIMIT 1');
    const cifradas = usuarios.length === 0 || usuarios[0].password.startsWith('$2');
    if (columnas.length === 0 || chat.length === 0 || !cifradas) {
        console.error('ATENCION: la base de datos es la version vieja.');
        console.error('Ejecuta INSTALAR_BASE_DE_DATOS.bat y vuelve a iniciar el servidor.');
    } else if (horarios.length === 0 || fotos.length === 0) {
        console.error('ATENCION: faltan tablas o columnas nuevas (fotos, vitrina, historial de la clienta...).');
        console.error('Ejecuta "node actualizar_bd.js" (no borra datos) y vuelve a iniciar el servidor.');
    }
}

// Antes de arrancar, se comprueba que MySQL responda
db.query('SELECT 1')
    .then(revisarBaseDeDatos)
    .then(() => {
        app.listen(config.puerto, () => {
            console.log('Conectado a MySQL');
            console.log(`Servidor en http://localhost:${config.puerto}`);
        });
    })
    .catch((err) => {
        console.error('No se pudo conectar a MySQL:', err.message);
        console.error('Revisa usuario y contraseña en backend/config/config.js');
        process.exit(1);
    });
