// Agrega las tablas nuevas (horarios, ausencias, calificaciones, chat de citas, fotos de servicios y productos, fotos de perfil, vitrina,
// profesión de la clienta, notas del servicio y límite de reprogramación)
// a una base que ya existe, SIN borrar ningún dato.
// Se puede ejecutar varias veces: si una tabla ya existe, no la toca.
// Uso:  node actualizar_bd.js
// Usa la misma configuración que el servidor (config/config.js o variables de entorno),
// así sirve igual para el MySQL de tu PC y para el de la nube (Aiven).
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
    )`
];

// Columnas nuevas en tablas que ya existen: [tabla, columna, definición].
// MySQL no tiene "ADD COLUMN IF NOT EXISTS", así que primero se pregunta si ya está.
const COLUMNAS = [
    ['clientas', 'profesion', 'VARCHAR(80) NULL'],
    ['citas', 'notas_servicio', 'VARCHAR(500) NULL'],
    ['citas', 'reprogramaciones', 'TINYINT NOT NULL DEFAULT 0']
];

// Las estilistas que todavía no tienen horario reciben el de siempre:
// lunes a sábado, de 8:00 a 19:00. Así nada cambia hasta que lo editen.
const HORARIO_POR_DEFECTO = `
    INSERT INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin)
    SELECT e.id_estilista, d.dia, '08:00', '19:00'
    FROM estilistas e
    CROSS JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
    WHERE NOT EXISTS (SELECT 1 FROM horarios h WHERE h.id_estilista = e.id_estilista)`;

async function actualizar() {
    const conexion = await mysql.createConnection(config.db);

    for (const sql of TABLAS) {
        await conexion.query(sql);
    }
    for (const [tabla, columna, definicion] of COLUMNAS) {
        const [existe] = await conexion.query(`SHOW COLUMNS FROM ${tabla} LIKE ?`, [columna]);
        if (existe.length === 0) await conexion.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    }
    const [resultado] = await conexion.query(HORARIO_POR_DEFECTO);
    const [tablas] = await conexion.query('SHOW TABLES');
    await conexion.end();

    console.log(`Base de datos actualizada (${tablas.length} tablas).`);
    console.log(`Horarios por defecto creados: ${resultado.affectedRows} filas.`);
}

actualizar().catch((err) => {
    console.error('No se pudo actualizar la base de datos:', err.message);
    console.error('Revisa la conexión en backend/config/config.js o en las variables de entorno.');
    process.exit(1);
});
