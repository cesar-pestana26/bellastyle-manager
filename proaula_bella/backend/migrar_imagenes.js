const mysql = require('mysql2/promise');
const config = require('./config/config');
const { nubeConfigurada, subirANube } = require('./utils/nube');

const TABLAS = [
    { tabla: 'fotos_servicio', id: 'id_foto', tipo: 'tipo', datos: 'datos', url: 'url', publicId: 'public_id', carpeta: 'servicios' },
    { tabla: 'fotos_producto', id: 'id_producto', tipo: 'tipo', datos: 'datos', url: 'url', publicId: 'public_id', carpeta: 'productos' },
    { tabla: 'fotos_perfil', id: 'id_usuario', tipo: 'tipo', datos: 'datos', url: 'url', publicId: 'public_id', carpeta: 'perfiles' },
    { tabla: 'vitrina', id: 'id_foto', tipo: 'tipo', datos: 'datos', url: 'url', publicId: 'public_id', carpeta: 'vitrina' },
    { tabla: 'pago_salon', id: 'id', tipo: 'qr_tipo', datos: 'qr_datos', url: 'qr_url', publicId: 'qr_public_id', carpeta: 'qr-salon' }
];

async function subirPendientes(conexion) {
    let subidas = 0;
    let fallidas = 0;
    for (const t of TABLAS) {
        const [filas] = await conexion.query(
            `SELECT ${t.id} AS id, ${t.tipo} AS tipo, ${t.datos} AS datos FROM ${t.tabla}
             WHERE ${t.datos} IS NOT NULL AND ${t.url} IS NULL`);
        for (const fila of filas) {
            try {
                const { url, publicId } = await subirANube(fila.tipo, fila.datos, t.carpeta);
                await conexion.query(
                    `UPDATE ${t.tabla} SET ${t.url} = ?, ${t.publicId} = ?, ${t.datos} = NULL WHERE ${t.id} = ? AND ${t.url} IS NULL`,
                    [url, publicId, fila.id]);
                subidas++;
            } catch (err) {
                fallidas++;
                console.error(`${t.tabla} #${fila.id}: no se pudo subir a Cloudinary (${err.message})`);
            }
        }
    }
    return { subidas, fallidas };
}

async function migrarImagenes(conexion) {
    if (!nubeConfigurada()) return null;
    const { subidas, fallidas } = await subirPendientes(conexion);
    if (subidas || fallidas) {
        console.log(`Imágenes pasadas de la base de datos a Cloudinary: ${subidas}. Fallidas: ${fallidas}.`);
    }
    return { subidas, fallidas };
}

async function estado(conexion) {
    for (const t of TABLAS) {
        const [[c]] = await conexion.query(
            `SELECT SUM(${t.url} IS NOT NULL) AS nube, SUM(${t.datos} IS NOT NULL) AS bd FROM ${t.tabla}`);
        console.log(`  ${t.tabla}: en Cloudinary ${Number(c.nube) || 0}, en la base de datos ${Number(c.bd) || 0}`);
    }
}

module.exports = migrarImagenes;

if (require.main === module) {
    (async () => {
        if (!nubeConfigurada()) {
            console.error('Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el .env.');
            process.exit(1);
        }
        await require('./actualizar_bd')();
        const conexion = await mysql.createConnection(config.db);
        try {
            const r = await migrarImagenes(conexion);
            if (!r.subidas && !r.fallidas) console.log('No había imágenes pendientes en la base de datos.');
            console.log('Estado actual:');
            await estado(conexion);
        } finally {
            await conexion.end();
        }
    })().catch((err) => {
        console.error('No se pudo migrar:', err.message);
        process.exit(1);
    });
}
