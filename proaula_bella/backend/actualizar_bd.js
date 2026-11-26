const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config/config');

const TABLAS = [
    `CREATE TABLE IF NOT EXISTS horarios (
        id_horario   INT AUTO_INCREMENT PRIMARY KEY,
        id_estilista INT NOT NULL,
        dia_semana   TINYINT NOT NULL,
        hora_inicio  TIME NOT NULL,
        hora_fin     TIME NOT NULL,
        CONSTRAINT uq_horario_dia UNIQUE (id_estilista, dia_semana),
        CONSTRAINT fk_horarios_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS ausencias (
        id_ausencia  INT AUTO_INCREMENT PRIMARY KEY,
        id_estilista INT NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin    DATE NOT NULL,
        motivo       VARCHAR(120),
        creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ausencias_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS calificaciones (
        id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
        id_cita         INT NOT NULL UNIQUE,
        estrellas       TINYINT NOT NULL,
        comentario      VARCHAR(300),
        creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT ck_estrellas CHECK (estrellas BETWEEN 1 AND 5),
        CONSTRAINT fk_calificaciones_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS mensajes_cita (
        id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
        id_cita    INT NOT NULL,
        autor      ENUM('Clienta','Estilista') NOT NULL,
        texto      VARCHAR(500) NOT NULL,
        leido      BOOLEAN NOT NULL DEFAULT FALSE,
        creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mensajes_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS fotos_servicio (
        id_foto     INT AUTO_INCREMENT PRIMARY KEY,
        id_servicio INT NOT NULL,
        tipo        VARCHAR(20) NOT NULL,
        datos       MEDIUMBLOB NOT NULL,
        creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fotos_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS fotos_perfil (
        id_usuario    INT PRIMARY KEY,
        tipo          VARCHAR(20) NOT NULL,
        datos         MEDIUMBLOB NOT NULL,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_fotos_perfil_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS vitrina (
        id_foto     INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario  INT NOT NULL,
        tipo        VARCHAR(20) NOT NULL,
        datos       MEDIUMBLOB NOT NULL,
        descripcion VARCHAR(120),
        creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_vitrina_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS fotos_producto (
        id_producto INT PRIMARY KEY,
        tipo        VARCHAR(20) NOT NULL,
        datos       MEDIUMBLOB NOT NULL,
        CONSTRAINT fk_fotos_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS pagos (
        id_pago     INT AUTO_INCREMENT PRIMARY KEY,
        id_cita     INT NOT NULL UNIQUE,
        referencia  VARCHAR(30) NOT NULL UNIQUE,
        metodo      ENUM('Nequi','Tarjeta','PSE','Efectivo / Salón') NOT NULL DEFAULT 'Efectivo / Salón',
        monto       DECIMAL(10,2) NOT NULL DEFAULT 0,
        estado      ENUM('Pagado','Pendiente en Salón','Reembolsado') NOT NULL DEFAULT 'Pagado',
        fecha_pago  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pagos_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS migraciones (
        nombre    VARCHAR(60) PRIMARY KEY,
        aplicada  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS pago_salon (
        id          TINYINT PRIMARY KEY DEFAULT 1,
        llave       VARCHAR(80),
        titular     VARCHAR(100),
        qr_tipo     VARCHAR(20),
        qr_datos    MEDIUMBLOB,
        actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS pedidos (
        id_pedido   INT AUTO_INCREMENT PRIMARY KEY,
        id_clienta  INT NOT NULL,
        total       DECIMAL(10,2) NOT NULL DEFAULT 0,
        estado      ENUM('Pendiente','Listo para recoger','Entregado','Cancelado') NOT NULL DEFAULT 'Pendiente',
        creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pedidos_clienta FOREIGN KEY (id_clienta) REFERENCES clientas(id_clienta)
    )`,
    `CREATE TABLE IF NOT EXISTS pedido_items (
        id_item     INT AUTO_INCREMENT PRIMARY KEY,
        id_pedido   INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad    INT NOT NULL,
        precio      DECIMAL(10,2) NOT NULL,
        CONSTRAINT fk_items_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
        CONSTRAINT fk_items_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    )`
];

const COLUMNAS = [
    ['clientas', 'profesion', 'VARCHAR(80) NULL'],
    ['citas', 'notas_servicio', 'VARCHAR(500) NULL'],
    ['citas', 'reprogramaciones', 'TINYINT NOT NULL DEFAULT 0'],

    ['usuarios', 'telefono', 'VARCHAR(30) NULL'],
    ['usuarios', 'email', 'VARCHAR(120) NULL'],

    ['servicios', 'publico', "ENUM('Mujer','Hombre','Unisex') NOT NULL DEFAULT 'Unisex'"],

    ['pagos', 'comprobante', 'VARCHAR(40) NULL'],

    ['fotos_servicio', 'url', 'VARCHAR(500) NULL'],
    ['fotos_servicio', 'public_id', 'VARCHAR(200) NULL'],
    ['fotos_perfil', 'url', 'VARCHAR(500) NULL'],
    ['fotos_perfil', 'public_id', 'VARCHAR(200) NULL'],
    ['vitrina', 'url', 'VARCHAR(500) NULL'],
    ['vitrina', 'public_id', 'VARCHAR(200) NULL'],
    ['fotos_producto', 'url', 'VARCHAR(500) NULL'],
    ['fotos_producto', 'public_id', 'VARCHAR(200) NULL'],
    ['pago_salon', 'qr_url', 'VARCHAR(500) NULL'],
    ['pago_salon', 'qr_public_id', 'VARCHAR(200) NULL']
];

const IMAGEN_OPCIONAL = ['fotos_servicio', 'fotos_perfil', 'vitrina', 'fotos_producto'];

const ENUMS = [
    ['pagos', 'metodo', "ENUM('Bre-B','Nequi','Tarjeta','PSE','Efectivo / Salón') NOT NULL DEFAULT 'Efectivo / Salón'", 'Bre-B'],
    ['pagos', 'estado', "ENUM('Pagado','Por verificar','Pendiente en Salón','Rechazado','Reembolsado') NOT NULL DEFAULT 'Pagado'", 'Por verificar']
];

async function datosPublico(conexion) {
    await conexion.query(`UPDATE servicios SET publico = 'Mujer'
        WHERE nombre IN ('Manicure', 'Pedicure', 'Mechas / Balayage', 'Peinado para Evento')`);
    const nuevos = [['Corte Caballero', 25000, 30], ['Arreglo de Barba', 18000, 30]];
    for (const [nombre, precio, duracion] of nuevos) {
        const [existe] = await conexion.query('SELECT id_servicio FROM servicios WHERE nombre = ?', [nombre]);
        if (existe.length) continue;
        const [r] = await conexion.query(
            "INSERT INTO servicios (nombre, precio, duracion_min, publico) VALUES (?, ?, ?, 'Hombre')", [nombre, precio, duracion]);
        await conexion.query(`INSERT IGNORE INTO estilista_servicios (id_estilista, id_servicio)
            SELECT es.id_estilista, ? FROM estilista_servicios es
            JOIN servicios s ON s.id_servicio = es.id_servicio WHERE s.nombre = 'Corte de Cabello'`, [r.insertId]);
    }
}

const HORARIO_POR_DEFECTO = `
    INSERT INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin)
    SELECT e.id_estilista, d.dia, '08:00', IF(d.dia = 0, '15:00', '19:00')
    FROM estilistas e
    CROSS JOIN (SELECT 0 AS dia UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
    WHERE NOT EXISTS (SELECT 1 FROM horarios h WHERE h.id_estilista = e.id_estilista)`;

const MIGRACIONES_DE_DATOS = [
    ['domingos-hasta-15', `INSERT IGNORE INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin)
        SELECT id_estilista, 0, '08:00', '15:00' FROM estilistas`],
    ['fotos-servicios-iniciales', (conexion) => cargarFotosIniciales(conexion)],
    ['fotos-productos-iniciales', (conexion) => cargarFotosProductos(conexion)]
];

const CARPETA_FOTOS = path.join(__dirname, '..', 'img');
const FOTOS_POR_SERVICIO = [
    ['Corte de Cabello', 'CORTE DE CABELLO (UNISEX)'],
    ['Corte Caballero', 'CORTE DE CABELLO'],
    ['Tinte / Coloración', 'TINTE'],
    ['Mechas / Balayage', 'MECHAS BALAYAGE'],
    ['Peinado para Evento', 'PEINADO PARA EVENTOS'],
    ['Manicure', 'MANICURE'],
    ['Pedicure', 'PEDICURE'],
    ['Tratamiento Capilar', 'TRATAMIENTO CAPILAR'],
    ['Arreglo de Barba', 'ARREGLO DE BARBA']
];
const MAX_FOTOS = 6;
const MAX_BYTES_FOTO = 1.5 * 1024 * 1024;

function tipoDeImagen(buffer) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer.slice(0, 4).toString('hex') === '89504e47') return 'image/png';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
    return null;
}

async function cargarFotosIniciales(conexion) {
    if (!fs.existsSync(CARPETA_FOTOS)) return false;
    for (const [servicio, carpeta] of FOTOS_POR_SERVICIO) {
        const dir = path.join(CARPETA_FOTOS, carpeta);
        if (!fs.existsSync(dir)) continue;
        const [filas] = await conexion.query(
            `SELECT s.id_servicio, (SELECT COUNT(*) FROM fotos_servicio f WHERE f.id_servicio = s.id_servicio) AS fotos
             FROM servicios s WHERE s.nombre = ? LIMIT 1`, [servicio]);
        if (!filas.length || Number(filas[0].fotos) > 0) continue;
        const archivos = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
        let puestas = 0;
        for (const archivo of archivos) {
            if (puestas >= MAX_FOTOS) break;
            const datos = fs.readFileSync(path.join(dir, archivo));
            const tipo = tipoDeImagen(datos);
            if (!tipo || datos.length > MAX_BYTES_FOTO) continue;
            await conexion.query('INSERT INTO fotos_servicio (id_servicio, tipo, datos) VALUES (?, ?, ?)',
                [filas[0].id_servicio, tipo, datos]);
            puestas++;
        }
    }
    return true;
}

const FOTOS_POR_PRODUCTO = [
    ['Shampoo Hidratante', 'SHAMPOO/SHAMPOO.jfif'],
    ['Mascarilla Capilar', 'MASCARILLA CAPILAR/MASCARILLA.jfif'],
    ['Esmalte Premium', 'ESMALTE PREMIUM/ESMALTE 1.jfif'],
    ['Spray Fijador', 'SPRAY/SPRAY.jfif']
];

async function cargarFotosProductos(conexion) {
    if (!fs.existsSync(CARPETA_FOTOS)) return false;
    for (const [producto, archivo] of FOTOS_POR_PRODUCTO) {
        const ruta = path.join(CARPETA_FOTOS, archivo);
        if (!fs.existsSync(ruta)) continue;
        const datos = fs.readFileSync(ruta);
        const tipo = tipoDeImagen(datos);
        if (!tipo || datos.length > MAX_BYTES_FOTO) continue;

        await conexion.query(
            `INSERT INTO fotos_producto (id_producto, tipo, datos)
             SELECT p.id_producto, ?, ? FROM productos p
             WHERE p.nombre = ? AND NOT EXISTS (SELECT 1 FROM fotos_producto f WHERE f.id_producto = p.id_producto)
             LIMIT 1`, [tipo, datos, producto]);
    }
    return true;
}

async function migracionesDeDatos(conexion) {
    for (const [nombre, tarea] of MIGRACIONES_DE_DATOS) {
        const [hecha] = await conexion.query('SELECT nombre FROM migraciones WHERE nombre = ?', [nombre]);
        if (hecha.length) continue;
        if (typeof tarea === 'function') {
            if (await tarea(conexion) === false) continue;
        } else {
            await conexion.query(tarea);
        }
        await conexion.query('INSERT INTO migraciones (nombre) VALUES (?)', [nombre]);
    }
}

async function actualizar() {
    const conexion = await mysql.createConnection(config.db);

    for (const sql of TABLAS) {
        await conexion.query(sql);
    }
    const creadas = [];
    for (const [tabla, columna, definicion] of COLUMNAS) {
        const [existe] = await conexion.query(`SHOW COLUMNS FROM ${tabla} LIKE ?`, [columna]);
        if (existe.length === 0) {
            await conexion.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
            creadas.push(`${tabla}.${columna}`);
        }
    }
    if (creadas.includes('servicios.publico')) await datosPublico(conexion);
    for (const tabla of IMAGEN_OPCIONAL) {
        const [col] = await conexion.query(`SHOW COLUMNS FROM ${tabla} LIKE 'datos'`);
        if (col.length && col[0].Null === 'NO') {
            await conexion.query(`ALTER TABLE ${tabla} MODIFY datos MEDIUMBLOB NULL`);
        }
    }
    for (const [tabla, columna, definicion, valorNuevo] of ENUMS) {
        const [col] = await conexion.query(`SHOW COLUMNS FROM ${tabla} LIKE ?`, [columna]);
        if (col.length && !String(col[0].Type).includes(`'${valorNuevo}'`)) {
            await conexion.query(`ALTER TABLE ${tabla} MODIFY ${columna} ${definicion}`);
        }
    }
    const [resultado] = await conexion.query(HORARIO_POR_DEFECTO);
    await migracionesDeDatos(conexion);
    const [tablas] = await conexion.query('SHOW TABLES');
    await conexion.end();

    console.log(`Base de datos actualizada (${tablas.length} tablas).`);
    console.log(`Horarios por defecto creados: ${resultado.affectedRows} filas.`);
}

module.exports = actualizar;

if (require.main === module) {
    actualizar().catch((err) => {
        console.error('No se pudo actualizar la base de datos:', err.message);
        console.error('Revisa la conexión en backend/config/config.js o en las variables de entorno.');
        process.exit(1);
    });
}
