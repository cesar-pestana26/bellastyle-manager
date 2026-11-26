const express = require('express');
const path = require('path');
const config = require('./config/config');
const db = require('./config/db');
const rutas = require('./routes/rutas');
const actualizarBD = require('./actualizar_bd');
const migrarImagenes = require('./migrar_imagenes');

const app = express();

app.use(express.json({ limit: '3mb' }));

app.get('/', (req, res) => res.redirect('/welcome.html'));

app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, ruta) => {
        if (/\.(html|js|css)$/.test(ruta)) res.setHeader('Cache-Control', 'no-cache');
    }
}));

app.use('/api', rutas);

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

db.query('SELECT 1')
    .then(() => actualizarBD().catch((err) => console.error('No se pudo actualizar la base de datos:', err.message)))
    .then(revisarBaseDeDatos)
    .then(() => {
        app.listen(config.puerto, () => {
            console.log('Conectado a MySQL');
            console.log(`Servidor en http://localhost:${config.puerto}`);
            migrarImagenes(db).catch((err) => console.error('No se pudieron pasar las imágenes a Cloudinary:', err.message));
        });
    })
    .catch((err) => {
        console.error('No se pudo conectar a MySQL:', err.message);
        console.error('Revisa usuario y contraseña en backend/config/config.js');
        process.exit(1);
    });
