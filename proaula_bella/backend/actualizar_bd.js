// Agrega las tablas nuevas (horarios, ausencias, calificaciones, chat de citas, fotos de servicios y productos, fotos de perfil, vitrina,
// profesión de la clienta, notas del servicio y límite de reprogramación)
// a una base que ya existe, SIN borrar ningún dato.
// Se puede ejecutar varias veces: si una tabla ya existe, no la toca.
// Uso:  node actualizar_bd.js
// Usa la misma configuración que el servidor (config/config.js o variables de entorno),
// así sirve igual para el MySQL de tu PC y para el de la nube (Aiven).
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
    // Cambios de datos que deben hacerse una sola vez (ej: abrir los domingos)
    `CREATE TABLE IF NOT EXISTS migraciones (
        nombre    VARCHAR(60) PRIMARY KEY,
        aplicada  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Datos de cobro del salón (una fila): llave Bre-B, titular y QR
    `CREATE TABLE IF NOT EXISTS pago_salon (
        id          TINYINT PRIMARY KEY DEFAULT 1,
        llave       VARCHAR(80),
        titular     VARCHAR(100),
        qr_tipo     VARCHAR(20),
        qr_datos    MEDIUMBLOB,
        actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    // Pedidos de la tienda: el encabezado del pedido y sus productos
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

// Columnas nuevas en tablas que ya existen: [tabla, columna, definición].
// MySQL no tiene "ADD COLUMN IF NOT EXISTS", así que primero se pregunta si ya está.
const COLUMNAS = [
    ['clientas', 'profesion', 'VARCHAR(80) NULL'],
    ['citas', 'notas_servicio', 'VARCHAR(500) NULL'],
    ['citas', 'reprogramaciones', 'TINYINT NOT NULL DEFAULT 0'],
    // Teléfono y correo de cada cuenta (estilistas y administradora), para recuperar la contraseña
    ['usuarios', 'telefono', 'VARCHAR(30) NULL'],
    ['usuarios', 'email', 'VARCHAR(120) NULL'],
    // Para quién es cada servicio: filtra el catálogo por Mujer, Hombre o Unisex
    ['servicios', 'publico', "ENUM('Mujer','Hombre','Unisex') NOT NULL DEFAULT 'Unisex'"],
    // Número de la transferencia Bre-B que escribe la clienta al pagar con el QR
    ['pagos', 'comprobante', 'VARCHAR(40) NULL']
];

// Listas (ENUM) que crecieron: se amplían sin perder los valores que ya existen
const ENUMS = [
    ['pagos', 'metodo', "ENUM('Bre-B','Nequi','Tarjeta','PSE','Efectivo / Salón') NOT NULL DEFAULT 'Efectivo / Salón'", 'Bre-B'],
    ['pagos', 'estado', "ENUM('Pagado','Por verificar','Pendiente en Salón','Rechazado','Reembolsado') NOT NULL DEFAULT 'Pagado'", 'Por verificar']
];

// Se ejecuta una sola vez, cuando se crea la columna servicios.publico:
// marca los servicios de mujer y agrega dos servicios de caballero,
// asignados a las estilistas que ya hacen "Corte de Cabello".
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

// Las estilistas que todavía no tienen horario reciben el de siempre:
// lunes a sábado de 8:00 a 19:00 y domingo de 8:00 a 15:00.
const HORARIO_POR_DEFECTO = `
    INSERT INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin)
    SELECT e.id_estilista, d.dia, '08:00', IF(d.dia = 0, '15:00', '19:00')
    FROM estilistas e
    CROSS JOIN (SELECT 0 AS dia UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
    WHERE NOT EXISTS (SELECT 1 FROM horarios h WHERE h.id_estilista = e.id_estilista)`;

// Cambios de datos que se aplican una sola vez. Se anotan en la tabla migraciones
// para no repetirlos (si una estilista luego quita el domingo, no se le vuelve a poner).
const MIGRACIONES_DE_DATOS = [
    ['domingos-hasta-15', `INSERT IGNORE INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin)
        SELECT id_estilista, 0, '08:00', '15:00' FROM estilistas`],
    ['fotos-servicios-iniciales', (conexion) => cargarFotosIniciales(conexion)]
];

// Fotos iniciales de los servicios: carpeta proaula_bella/img/<CARPETA>/ → servicio por su nombre.
// Solo se cargan en los servicios que aún no tienen fotos (no pisa lo que suba la administradora).
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
const MAX_FOTOS = 6;                       // igual que fotoServicioModel.MAX_POR_SERVICIO
const MAX_BYTES_FOTO = 1.5 * 1024 * 1024;  // igual que utils/imagenes.js

function tipoDeImagen(buffer) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer.slice(0, 4).toString('hex') === '89504e47') return 'image/png';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
    return null;
}

// Devuelve false si la carpeta img no está (por ejemplo, en una imagen de Docker vieja): así se intenta de nuevo luego.
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

// El servidor (app.js) la llama al arrancar, así Render/Aiven reciben las tablas nuevas solos.
module.exports = actualizar;

// Si se ejecuta a mano: node actualizar_bd.js
if (require.main === module) {
    actualizar().catch((err) => {
        console.error('No se pudo actualizar la base de datos:', err.message);
        console.error('Revisa la conexión en backend/config/config.js o en las variables de entorno.');
        process.exit(1);
    });
}
