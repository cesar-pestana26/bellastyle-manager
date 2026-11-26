SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS bellastylemanager
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE bellastylemanager;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS migraciones;
DROP TABLE IF EXISTS pago_salon;
DROP TABLE IF EXISTS pedido_items;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS agenda;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS vitrina;
DROP TABLE IF EXISTS fotos_producto;
DROP TABLE IF EXISTS fotos_perfil;
DROP TABLE IF EXISTS fotos_servicio;
DROP TABLE IF EXISTS mensajes_cita;
DROP TABLE IF EXISTS calificaciones;
DROP TABLE IF EXISTS ausencias;
DROP TABLE IF EXISTS horarios;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS conversaciones;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS estilista_servicios;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS estilistas;
DROP TABLE IF EXISTS clientas;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
    id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         ENUM('Administradora','Estilista','Clienta') NOT NULL DEFAULT 'Clienta',
    foto        VARCHAR(255),
    telefono    VARCHAR(30),
    email       VARCHAR(120),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientas (
    id_clienta  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT UNIQUE,
    nombres     VARCHAR(80) NOT NULL,
    apellidos   VARCHAR(80) NOT NULL,
    telefono    VARCHAR(30),
    email       VARCHAR(120),
    profesion   VARCHAR(80),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE estilistas (
    id_estilista INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT UNIQUE,
    nombres      VARCHAR(80) NOT NULL,
    apellidos    VARCHAR(80) NOT NULL,
    especialidad VARCHAR(80) DEFAULT 'General',
    estado       ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estilistas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE servicios (
    id_servicio  INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    precio       DECIMAL(10,2) NOT NULL DEFAULT 0,
    duracion_min INT NOT NULL DEFAULT 60,
    publico      ENUM('Mujer','Hombre','Unisex') NOT NULL DEFAULT 'Unisex',
    estado       ENUM('Disponible','No disponible') NOT NULL DEFAULT 'Disponible'
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    precio      DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock       INT NOT NULL DEFAULT 0,
    estado      ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
);

CREATE TABLE estilista_servicios (
    id_estilista INT NOT NULL,
    id_servicio  INT NOT NULL,
    PRIMARY KEY (id_estilista, id_servicio),
    CONSTRAINT fk_es_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE,
    CONSTRAINT fk_es_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)   ON DELETE CASCADE
);

CREATE TABLE citas (
    id_cita       INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente    INT NOT NULL,
    id_estilista  INT NOT NULL,
    id_servicio   INT NOT NULL,
    fecha         DATE NOT NULL,
    hora          TIME NOT NULL,
    precio        DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado        ENUM('Pendiente','Confirmada','Finalizada','Cancelada') NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT,
    notas_servicio VARCHAR(500),
    reprogramaciones TINYINT NOT NULL DEFAULT 0,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_cliente   FOREIGN KEY (id_cliente)   REFERENCES clientas(id_clienta),
    CONSTRAINT fk_citas_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista),
    CONSTRAINT fk_citas_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)
);

CREATE TABLE pagos (
    id_pago     INT AUTO_INCREMENT PRIMARY KEY,
    id_cita     INT NOT NULL UNIQUE,
    referencia  VARCHAR(30) NOT NULL UNIQUE,
    metodo      ENUM('Bre-B','Nequi','Tarjeta','PSE','Efectivo / Salón') NOT NULL DEFAULT 'Efectivo / Salón',
    monto       DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado      ENUM('Pagado','Por verificar','Pendiente en Salón','Rechazado','Reembolsado') NOT NULL DEFAULT 'Pagado',
    comprobante VARCHAR(40),
    fecha_pago  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
);

CREATE TABLE migraciones (
    nombre    VARCHAR(60) PRIMARY KEY,
    aplicada  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO migraciones (nombre) VALUES ('domingos-hasta-15');

CREATE TABLE pago_salon (
    id          TINYINT PRIMARY KEY DEFAULT 1,
    llave       VARCHAR(80),
    titular     VARCHAR(100),
    qr_tipo     VARCHAR(20),
    qr_datos    MEDIUMBLOB,
    qr_url      VARCHAR(500),
    qr_public_id VARCHAR(200),
    actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id_pedido   INT AUTO_INCREMENT PRIMARY KEY,
    id_clienta  INT NOT NULL,
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado      ENUM('Pendiente','Listo para recoger','Entregado','Cancelado') NOT NULL DEFAULT 'Pendiente',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_clienta FOREIGN KEY (id_clienta) REFERENCES clientas(id_clienta)
);

CREATE TABLE pedido_items (
    id_item     INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido   INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad    INT NOT NULL,
    precio      DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_items_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_items_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE conversaciones (
    id_conversacion INT AUTO_INCREMENT PRIMARY KEY,
    codigo          CHAR(32)     NOT NULL UNIQUE,
    nombre          VARCHAR(60)  NOT NULL,
    contacto        VARCHAR(120),
    estado          ENUM('Abierta','Cerrada') NOT NULL DEFAULT 'Abierta',
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mensajes (
    id_mensaje      INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion INT NOT NULL,
    autor           ENUM('Visitante','Salon','Asistente') NOT NULL,
    texto           VARCHAR(500) NOT NULL,
    leido           BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_conversacion FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE
);

CREATE TABLE horarios (
    id_horario   INT AUTO_INCREMENT PRIMARY KEY,
    id_estilista INT NOT NULL,
    dia_semana   TINYINT NOT NULL,
    hora_inicio  TIME NOT NULL,
    hora_fin     TIME NOT NULL,
    CONSTRAINT uq_horario_dia UNIQUE (id_estilista, dia_semana),
    CONSTRAINT fk_horarios_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE
);

CREATE TABLE ausencias (
    id_ausencia  INT AUTO_INCREMENT PRIMARY KEY,
    id_estilista INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE NOT NULL,
    motivo       VARCHAR(120),
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ausencias_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE
);

CREATE TABLE calificaciones (
    id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_cita         INT NOT NULL UNIQUE,
    estrellas       TINYINT NOT NULL,
    comentario      VARCHAR(300),
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_estrellas CHECK (estrellas BETWEEN 1 AND 5),
    CONSTRAINT fk_calificaciones_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
);

CREATE TABLE mensajes_cita (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_cita    INT NOT NULL,
    autor      ENUM('Clienta','Estilista') NOT NULL,
    texto      VARCHAR(500) NOT NULL,
    leido      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
);

CREATE TABLE fotos_servicio (
    id_foto     INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT NOT NULL,
    tipo        VARCHAR(20) NOT NULL,
    datos       MEDIUMBLOB NULL,
    url         VARCHAR(500) NULL,
    public_id   VARCHAR(200) NULL,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fotos_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE CASCADE
);

CREATE TABLE fotos_producto (
    id_producto INT PRIMARY KEY,
    tipo        VARCHAR(20) NOT NULL,
    datos       MEDIUMBLOB NULL,
    url         VARCHAR(500) NULL,
    public_id   VARCHAR(200) NULL,
    CONSTRAINT fk_fotos_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);

CREATE TABLE fotos_perfil (
    id_usuario    INT PRIMARY KEY,
    tipo          VARCHAR(20) NOT NULL,
    datos         MEDIUMBLOB NULL,
    url           VARCHAR(500) NULL,
    public_id     VARCHAR(200) NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fotos_perfil_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE vitrina (
    id_foto     INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT NOT NULL,
    tipo        VARCHAR(20) NOT NULL,
    datos       MEDIUMBLOB NULL,
    url         VARCHAR(500) NULL,
    public_id   VARCHAR(200) NULL,
    descripcion VARCHAR(120),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vitrina_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

INSERT INTO usuarios (id_usuario, nombre, username, password, rol, foto, telefono, email) VALUES
(1, 'Admin',     'admin',     '$2a$10$7O3CX9v7kC.M0uWTje439.EQoFP/nNOfSQRGVmwIkL4e6WS.cDqSu', 'Administradora', 'img/rol_admin.svg', '3005550001', 'admin@bellastyle.com'),
(2, 'Laura Estilista', 'estilista', '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/rol_estilista.svg', '3005550002', 'laura@bellastyle.com'),
(3, 'Diana Martínez',  'diana',     '$2a$10$keW7X2fdPNp3lekvelDIJeqnaEtWHFNH3AsRn41qr1RlNMndqXtsO', 'Estilista',      'img/rol_estilista.svg', '3005550003', 'diana@bellastyle.com'),
(4, 'Paula Ríos',      'paula',     '$2a$10$8QYcfgNx/jt2VrF1ECRwie2X6OfGjQHXLppFYJ3Pe9MkEG6UcPPQa', 'Estilista',      'img/rol_estilista.svg', '3005550004', 'paula@bellastyle.com'),
(5, 'César Pestana',   'cliente',   '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/rol_clienta.svg', '3001112233', 'cesar@correo.com');

INSERT INTO clientas (id_clienta, id_usuario, nombres, apellidos, telefono, email) VALUES
(1, 5,    'César', 'Pestana',  '3001112233', 'cesar@correo.com'),
(2, NULL, 'María', 'García',   '3014445566', 'maria@correo.com'),
(3, NULL, 'Sofía', 'Restrepo', '3027778899', 'sofia@correo.com');

INSERT INTO estilistas (id_estilista, id_usuario, nombres, apellidos, especialidad) VALUES
(1, 2, 'Laura', 'Estilista', 'Color y mechas'),
(2, 3, 'Diana', 'Martínez',  'Corte y peinado'),
(3, 4, 'Paula', 'Ríos',      'Manicure y spa');

INSERT INTO servicios (id_servicio, nombre, precio, duracion_min, publico) VALUES
(1, 'Corte de Cabello',     35000,  45, 'Unisex'),
(2, 'Tinte / Coloración',  120000, 120, 'Unisex'),
(3, 'Mechas / Balayage',   180000, 150, 'Mujer'),
(4, 'Peinado para Evento',  60000,  60, 'Mujer'),
(5, 'Manicure',             25000,  45, 'Mujer'),
(6, 'Pedicure',             30000,  60, 'Mujer'),
(7, 'Tratamiento Capilar',  55000,  60, 'Unisex'),
(8, 'Corte Caballero',      25000,  30, 'Hombre'),
(9, 'Arreglo de Barba',     18000,  30, 'Hombre');

INSERT INTO productos (nombre, precio, stock) VALUES
('Shampoo Hidratante', 28000, 20),
('Mascarilla Capilar', 35000, 15),
('Esmalte Premium',    12000, 40),
('Spray Fijador',      22000, 18);

INSERT INTO estilista_servicios (id_estilista, id_servicio) VALUES
(1, 2), (1, 3),
(2, 1), (2, 4), (2, 7),
(2, 8), (2, 9),
(3, 5), (3, 6);

INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, precio, estado, observaciones) VALUES
(1, 2, 1, '2026-05-25', '10:00:00',  35000, 'Finalizada', 'Cita de ejemplo'),
(2, 1, 2, '2026-05-26', '14:00:00', 120000, 'Finalizada', NULL),
(3, 3, 5, '2026-05-27', '09:00:00',  25000, 'Cancelada',  NULL);

INSERT INTO conversaciones (id_conversacion, codigo, nombre, contacto) VALUES
(1, '0123456789abcdef0123456789abcdef', 'Valentina Ruiz', '3105556677');

INSERT INTO mensajes (id_conversacion, autor, texto, leido) VALUES
(1, 'Asistente', '¡Hola, Valentina! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar. Si necesitas algo más, una asesora te responde por aquí.', TRUE),
(1, 'Visitante', 'Hola, ¿hacen peinados para quinceañera a domicilio?', FALSE),
(1, 'Asistente', 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.', TRUE);

INSERT INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin) VALUES
(1, 1, '08:00', '19:00'), (1, 2, '08:00', '19:00'), (1, 3, '08:00', '19:00'),
(1, 4, '08:00', '19:00'), (1, 5, '08:00', '19:00'), (1, 6, '08:00', '19:00'),
(1, 0, '08:00', '15:00'),
(2, 1, '09:00', '17:00'), (2, 2, '09:00', '17:00'), (2, 3, '09:00', '17:00'),
(2, 4, '09:00', '17:00'), (2, 5, '09:00', '17:00'), (2, 0, '09:00', '15:00'),
(3, 2, '08:00', '14:00'), (3, 3, '08:00', '14:00'), (3, 4, '08:00', '14:00'),
(3, 5, '08:00', '14:00'), (3, 6, '08:00', '14:00'), (3, 0, '08:00', '14:00');

INSERT INTO calificaciones (id_cita, estrellas, comentario) VALUES
(1, 5, 'Excelente corte, muy puntual.'),
(2, 4, 'Me encantó el color.');
