# Genera el Manual Técnico de BellaStyle Manager en Word y PDF con normas APA 7.
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from apa import DocAPA
from portada import AUTORES, INSTITUCION, CURSO, PROFESOR, FECHA
from refs import REFS_TECNICO

DIAG = sys.argv[1]          # carpeta docs/diagramas
SALIDA = sys.argv[2]        # ruta del .docx
D = DocAPA()

D.portada('Manual Técnico de BellaStyle Manager',
          'Sistema web de gestión para un salón de belleza',
          AUTORES, INSTITUCION, CURSO, PROFESOR, FECHA)
D.indice()

# ------------------------------------------------------------------ 1
D.titulo('Introducción', 1)
D.parrafo('Este documento es el Manual Técnico de BellaStyle Manager, una aplicación web que ayuda a un salón de belleza a organizar sus citas, su equipo de estilistas, sus servicios, sus cobros y su tienda de productos. Está escrito para quien tenga que instalar, mantener o mejorar el sistema: el personal de soporte técnico, los integrantes del equipo y los docentes que lo evalúan.')
D.parrafo('El manual sigue la estructura de la guía ~Manuales técnicos de la aplicación~ del Servicio Nacional de Aprendizaje (SENA, s. f.): alcance, procesos, diagramas UML, administración de usuarios, base de datos, plataforma, código fuente y acuerdos de niveles de servicio. Se usa un lenguaje sencillo; cuando aparece un término técnico, se explica en el mismo párrafo o en el glosario del final.')
D.parrafo('La aplicación está publicada en **https://bellastyle.onrender.com**. El código fuente está en el repositorio de GitHub **cesar-pestana26/bellastyle-manager** (rama main). En el computador de desarrollo el mismo sistema funciona en http://localhost:3000.')

D.titulo('Propósito del documento', 2)
D.parrafo('Explicar cómo está construido BellaStyle Manager, dónde está cada parte, cómo se instala y qué hacer cuando algo falla, de modo que otra persona pueda continuar el proyecto sin depender de quienes lo desarrollaron.')

# ------------------------------------------------------------------ 2
D.titulo('Alcance del sistema', 1)
D.titulo('Objetivo general', 2)
D.parrafo('Desarrollar un sistema web que permita a un salón de belleza gestionar en línea sus citas, su personal, su catálogo de servicios y productos y el cobro de sus servicios, con una experiencia sencilla para la clienta y control completo para la administradora.')
D.titulo('Objetivos específicos', 2)
D.lista([
    'Permitir el registro y el inicio de sesión con tres roles (Clienta, Estilista y Administradora), con contraseñas protegidas y sesión segura.',
    'Agendar citas mostrando solo las horas libres, según el horario y las ausencias de cada estilista, y asignar la estilista de forma automática.',
    'Registrar el pago de cada cita con Bre-B (código QR o llave) o en el salón, y que la administradora lo confirme.',
    'Ofrecer una tienda con carrito para que la clienta pida productos y los recoja en el salón.',
    'Gestionar servicios, productos, fotos, estilistas, clientas, horarios y la vitrina de trabajos.',
    'Atender a los visitantes con Bella, un asistente de chat con inteligencia artificial que responde con los datos reales del salón.',
    'Publicar el sistema en internet con su base de datos en la nube.',
])
D.titulo('Lo que el sistema no cubre', 2)
D.parrafo('No está conectado directamente con los bancos: el pago con Bre-B lo confirma la administradora cuando ve la transferencia en su cuenta. Tampoco incluye facturación electrónica ante la DIAN, inventario de proveedores, nómina ni envío de mensajes por correo o SMS.')

# ------------------------------------------------------------------ 3
D.titulo('Descripción de los procesos', 1)
D.parrafo('El proceso principal del salón es **atender citas**. Alrededor de él hay procesos de apoyo: cobrar, vender productos, administrar el equipo y responder preguntas de los visitantes. La Tabla 1 los resume en palabras sencillas.')
D.tabla('Procesos que apoya BellaStyle Manager',
        ['Proceso', 'Quién participa', 'Qué pasa en el sistema'],
        [
            ['Agendar una cita', 'Clienta', 'Elige el servicio, la estilista (o deja que el sistema la asigne), la fecha y una hora libre. El sistema revisa horario, ausencias, fechas pasadas y cruces antes de guardar.'],
            ['Atender la cita', 'Estilista', 'Confirma la cita, chatea con la clienta, la finaliza y escribe notas del servicio (productos, tono, técnica).'],
            ['Cobrar la cita', 'Clienta y administradora', 'La clienta paga con Bre-B (QR o llave) y escribe el número del comprobante, o elige pagar en el salón. La administradora confirma el pago.'],
            ['Vender productos', 'Clienta y administradora', 'La clienta arma un carrito y hace el pedido; el sistema descuenta las unidades. La administradora lo marca como listo, entregado o cancelado.'],
            ['Administrar el salón', 'Administradora', 'Gestiona servicios, precios, fotos, productos, estilistas, clientas, horarios y la vitrina; ve ingresos y la liquidación 60/40.'],
            ['Atender visitantes', 'Visitante, Bella y administradora', 'El visitante pregunta por el chat sin registrarse; Bella responde con inteligencia artificial y la administradora puede intervenir.'],
        ], anchos=[1.4, 1.4, 3.7])

D.titulo('Requerimientos funcionales', 2)
D.parrafo('Un requerimiento funcional es algo que el sistema debe hacer. La Tabla 2 lista los que se implementaron.')
D.tabla('Requerimientos funcionales implementados',
        ['Código', 'Requerimiento'],
        [
            ['RF01', 'Registrar cuentas de clienta, estilista y administradora (esta última con un código secreto).'],
            ['RF02', 'Iniciar sesión por rol con un token que vence en 8 horas; máximo 3 intentos fallidos y luego 3 minutos de espera.'],
            ['RF03', 'Recuperar la contraseña con el usuario y el teléfono o correo registrado; al lograrlo se quita el bloqueo del inicio de sesión.'],
            ['RF04', 'Agendar citas mostrando solo horas libres (lunes a sábado de 8:00 a 19:00 y domingo de 8:00 a 15:00).'],
            ['RF05', 'Asignar automáticamente la estilista libre que sabe hacer el servicio y tiene menos citas ese día.'],
            ['RF06', 'Reprogramar una cita una sola vez y cancelarla (clienta).'],
            ['RF07', 'Confirmar, finalizar o cancelar citas y escribir notas del servicio (estilista y administradora).'],
            ['RF08', 'Pagar una cita con Bre-B (QR o llave, con número de comprobante) o en el salón; la clienta puede ver el QR en grande y descargarlo.'],
            ['RF09', 'Confirmar o rechazar pagos e indicar si el cobro en el salón fue en efectivo o con QR (administradora).'],
            ['RF10', 'Subir el QR de Bre-B del salón, con llave y titular opcionales y vista previa (administradora).'],
            ['RF11', 'Comprar productos con un carrito y hacer el pedido; descontar y devolver unidades según el estado del pedido.'],
            ['RF12', 'Crear, editar, activar y desactivar servicios (con público Mujer, Hombre o Unisex) y productos, con sus fotos.'],
            ['RF13', 'Asignar los servicios de cada estilista y definir su horario semanal y ausencias.'],
            ['RF14', 'Editar los datos de las clientas y consultar su historial de servicios.'],
            ['RF15', 'Calificar con 1 a 5 estrellas las citas finalizadas.'],
            ['RF16', 'Chatear entre la clienta y la estilista de cada cita.'],
            ['RF17', 'Generar el comprobante PDF de una cita finalizada.'],
            ['RF18', 'Mostrar ingresos y la liquidación: 60 % para la estilista y 40 % para el salón.'],
            ['RF19', 'Atender visitantes sin cuenta con Bella (inteligencia artificial) y permitir que la administradora responda.'],
            ['RF20', 'Publicar fotos en la vitrina de trabajos y cambiar la foto de perfil.'],
            ['RF21', 'Permitir a cada rol solo sus acciones y sus propios datos.'],
            ['RF22', 'Evitar que dos citas ocupen la misma hora de una estilista aunque se pidan al mismo tiempo.'],
        ], anchos=[0.8, 5.7])

D.titulo('Requerimientos no funcionales', 2)
D.parrafo('Son cualidades que el sistema debe tener, más allá de lo que hace (Sommerville, 2011). La Tabla 3 muestra cómo se cumplen.')
D.tabla('Requerimientos no funcionales y cómo se cumplen',
        ['Cualidad', 'Cómo se cumple'],
        [
            ['Seguridad', 'Contraseñas cifradas con bcrypt, sesión con token JWT, permisos por rol, límite de intentos y consultas a la base de datos protegidas contra inyección SQL.'],
            ['Disponibilidad', 'Publicado en internet con HTTPS (Render) y base de datos administrada con respaldos (Aiven).'],
            ['Usabilidad', 'Diseño adaptable a celular, tableta y computador; modo claro y oscuro; mensajes de error en lenguaje sencillo.'],
            ['Integridad de los datos', 'Llaves foráneas, restricciones UNIQUE y CHECK, y transacciones en las operaciones que tocan varias tablas.'],
            ['Tolerancia a fallos', 'Si la inteligencia artificial no responde, Bella contesta con un asistente de respaldo por palabras clave.'],
            ['Mantenibilidad', 'Código organizado en capas (rutas, controladores, modelos) y base de datos que se actualiza sola al arrancar.'],
        ], anchos=[1.6, 4.9])

# ------------------------------------------------------------------ 4
D.salto()
D.titulo('Diagramas UML', 1)
D.parrafo('UML (Lenguaje Unificado de Modelado) es la notación estándar para dibujar cómo es un sistema de software (Object Management Group, 2017). Los diagramas de BellaStyle Manager están en la carpeta ~docs/diagramas~ del proyecto, y sus fuentes editables en ~docs/diagramas/fuentes~.')

D.titulo('Diagrama de casos de uso', 2)
D.parrafo('Muestra quién usa el sistema (actores) y qué puede hacer cada uno (casos de uso). Se dividió en dos partes para que se lea bien. La relación «include» indica algo que siempre ocurre (agendar incluye asignar estilista) y «extend» algo que ocurre solo a veces (pagar la cita se extiende con escanear el QR de Bre-B).')
D.figura(os.path.join(DIAG, 'Casos_de_Uso.png'), 'Casos de uso: visitante y clienta (izquierda); estilista y administradora (derecha)', ancho=6.5)

D.titulo('Diagrama de clases', 2)
D.parrafo('Representa las cosas que maneja el sistema (clases), sus datos (atributos), lo que se puede hacer con ellas (operaciones) y cómo se relacionan. Por ejemplo, una Cita tiene como máximo un Pago, y un Pedido contiene uno o más ítems, cada uno de un Producto. El rombo negro (composición) significa que la parte no existe sin el todo: si se borra la cita, se borra su pago.')
D.figura(os.path.join(DIAG, 'Diagrama_Clases.png'), 'Diagrama de clases de BellaStyle Manager', ancho=6.5)

D.titulo('Diagramas de componentes', 2)
D.parrafo('Muestran las piezas de software y cómo dependen unas de otras. Según la norma UML 2.5, los componentes no se unen con flechas sino por **interfaces**: la bola es lo que un componente ofrece (interfaz provista) y la media luna lo que necesita (interfaz requerida). La vista general muestra los cuatro bloques grandes y la detallada abre el servidor por dentro.')
D.figura(os.path.join(DIAG, 'Diagrama_Componentes_General.png'), 'Componentes: vista general', ancho=6.5)
D.figura(os.path.join(DIAG, 'Diagrama_Componentes_Detallado.png'), 'Componentes: vista detallada del servidor', ancho=6.5,
         nota='El componente «Pagos y PDF» contiene el módulo de pago con Bre-B; «Tienda y pedidos» maneja el carrito. Ambos usan la base de datos a través de la interfaz IAccesoDatos.')

D.titulo('Diagrama de despliegue', 2)
D.parrafo('Muestra en qué máquinas se ejecuta cada parte cuando el sistema está publicado. Un nodo «device» es una máquina (el celular del usuario, el servidor de Render, el servidor de Aiven); un «executionEnvironment» es el programa que ejecuta el código (el navegador, Node.js, MySQL). Las líneas indican cómo se comunican: HTTPS entre el navegador y Render, TCP/IP cifrado con SSL entre Render y la base de datos, y HTTPS hacia la API de Gemini.')
D.figura(os.path.join(DIAG, 'Diagrama_Despliegue_Nube.png'), 'Despliegue de BellaStyle Manager en la nube', ancho=6.5)

D.titulo('Diagramas de secuencia y de comunicación', 2)
D.parrafo('El diagrama de secuencia muestra, en orden de tiempo de arriba hacia abajo, los mensajes que se envían las partes del sistema para cumplir una tarea. El de comunicación muestra los mismos mensajes numerados, pero resalta qué objetos se comunican entre sí.')
D.figura(os.path.join(DIAG, 'Secuencia_Agendar_Cita.png'), 'Secuencia para agendar una cita', ancho=6.3)
D.figura(os.path.join(DIAG, 'Secuencia_Chat.png'), 'Secuencia del chat con Bella (asistente con inteligencia artificial)', ancho=6.3)
D.figura(os.path.join(DIAG, 'Diagrama_Comunicacion.png'), 'Diagrama de comunicación', ancho=6.3)

D.titulo('Mapa de navegación', 2)
D.parrafo('Indica cómo se pasa de una pantalla a otra. La dirección principal abre la página de inicio del salón; desde el menú se llega a Servicios, Galería, Tienda e Iniciar sesión, y cada rol entra a su panel.')
D.figura(os.path.join(DIAG, 'Mapa_Navegacion.png'), 'Mapa de navegación entre pantallas', ancho=6.5)

# ------------------------------------------------------------------ 5
D.titulo('Administración de usuarios', 1)
D.titulo('Roles y permisos', 2)
D.tabla('Roles del sistema y lo que puede hacer cada uno',
        ['Rol', 'Permisos'],
        [
            ['Visitante (sin cuenta)', 'Ver la página del salón, servicios, galería y tienda; armar el carrito; chatear con Bella.'],
            ['Clienta', 'Agendar, reprogramar (una vez) y cancelar sus citas; pagarlas; calificarlas; chatear con su estilista; descargar el comprobante; hacer pedidos; editar sus datos y su foto. Solo ve lo suyo.'],
            ['Estilista', 'Ver sus citas; confirmarlas, finalizarlas o cancelarlas; escribir notas; definir su horario y ausencias; publicar en la vitrina; ver su calificación y su comisión (60 %).'],
            ['Administradora', 'Todo lo anterior sobre cualquier cita, más: confirmar pagos, configurar el QR de Bre-B, manejar pedidos, servicios, productos, fotos, estilistas, clientas, vitrina, mensajes de Bella y la liquidación.'],
        ], anchos=[1.6, 4.9])
D.titulo('Creación, modificación y retiro de cuentas', 2)
D.lista([
    '**Creación.** Cada persona se registra en la página Crear cuenta. Debe escribir un teléfono de 10 dígitos o un correo, que luego sirve para recuperar la contraseña. El nombre solo acepta letras y espacios. La cuenta de administradora exige un código secreto (variable CODIGO_ADMIN).',
    '**Modificación.** La clienta edita sus datos y su foto desde su panel; la administradora edita clientas, servicios de cada estilista y su propio nombre visible.',
    '**Retiro.** Las estilistas no se borran, para conservar el historial de citas: se marcan como Inactivo (columna estilistas.estado, ruta PUT /api/estilistas/:id/estado) y una estilista inactiva no recibe citas nuevas.',
])
D.titulo('Inicio de sesión, recuperación y bloqueo', 2)
D.parrafo('Al iniciar sesión, el servidor entrega un **token JWT**: un texto firmado que dice quién es la persona y qué rol tiene, y que vence en 8 horas (Jones et al., 2015). El navegador lo envía en cada petición. Si alguien lo modifica, la firma deja de coincidir y el servidor lo rechaza.')
D.parrafo('Después de **3 contraseñas equivocadas seguidas**, la cuenta espera **3 minutos** antes de volver a intentarlo. Esto protege contra los ataques de fuerza bruta, que prueban muchas contraseñas. La recuperación de contraseña tiene su propio contador de 3 intentos. Si la persona recupera bien su contraseña (usuario más teléfono o correo registrado), el bloqueo del inicio de sesión se quita y puede entrar de inmediato.')

# ------------------------------------------------------------------ 6
D.salto()
D.titulo('Base de datos', 1)
D.parrafo('La base de datos se llama **bellastylemanager**, usa MySQL 8.4 (Oracle, s. f.) y tiene **22 tablas**. En internet está alojada en Aiven (Aiven, s. f.), un proveedor que administra la base, hace copias de seguridad y exige conexión cifrada. En el computador de desarrollo se crea con el archivo ~init_db.sql~.')
D.figura(os.path.join(DIAG, 'Modelo_Datos.png'), 'Modelo relacional de la base de datos (22 tablas)', ancho=6.0, alto_max=8.0)
D.titulo('Grupos de tablas', 2)
D.tabla('Las 22 tablas organizadas por grupo',
        ['Grupo', 'Tablas', 'Para qué sirven'],
        [
            ['Cuentas (4)', 'usuarios, clientas, estilistas, fotos_perfil', 'Inicio de sesión, rol, datos de contacto y foto de cada persona.'],
            ['Catálogo (5)', 'servicios, productos, estilista_servicios, fotos_servicio, fotos_producto', 'Lo que ofrece el salón y quién sabe hacer cada servicio.'],
            ['Agenda (5)', 'citas, horarios, ausencias, calificaciones, mensajes_cita', 'Citas y todo lo que gira alrededor de ellas.'],
            ['Pagos y tienda (4)', 'pagos, pago_salon, pedidos, pedido_items', 'Cobro de citas con Bre-B, QR del salón y pedidos de productos.'],
            ['Chat de visitantes (2)', 'conversaciones, mensajes', 'Conversaciones con Bella desde la página de inicio.'],
            ['Vitrina y sistema (2)', 'vitrina, migraciones', 'Fotos de trabajos y registro de cambios de datos ya aplicados.'],
        ], anchos=[1.5, 2.4, 2.6])
D.titulo('Relaciones principales', 2)
D.tabla('Relaciones entre tablas',
        ['Relación', 'Tipo', 'Cómo se implementó'],
        [
            ['usuarios – clientas / estilistas', '1 a 0..1', 'id_usuario es llave foránea y UNIQUE.'],
            ['estilistas – servicios', 'N a M', 'Tabla intermedia estilista_servicios con llave compuesta.'],
            ['citas – clientas, estilistas, servicios', 'N a 1', 'Tres llaves foráneas; no se borran en cascada para proteger el historial.'],
            ['citas – pagos', '1 a 0..1', 'pagos.id_cita es UNIQUE: una cita tiene un solo pago.'],
            ['citas – calificaciones', '1 a 0..1', 'Una calificación por cita, con CHECK de 1 a 5 estrellas.'],
            ['pedidos – productos', 'N a M', 'Tabla intermedia pedido_items con cantidad y precio del momento.'],
            ['clientas – pedidos', '1 a N', 'pedidos.id_clienta es llave foránea.'],
            ['estilistas – horarios', '1 a N (máx. 7)', 'UNIQUE (id_estilista, dia_semana): un horario por día.'],
        ], anchos=[2.2, 1.0, 3.3])
D.titulo('Diccionario de datos', 2)
D.parrafo('La Tabla 7 describe las columnas más importantes. PK significa llave primaria (identifica cada fila) y FK llave foránea (apunta a otra tabla).')
D.tabla('Diccionario de datos (columnas principales)',
        ['Tabla', 'Columna', 'Tipo', 'Descripción'],
        [
            ['usuarios', 'id_usuario', 'INT PK', 'Identificador de la cuenta.'],
            ['', 'username', 'VARCHAR(50) UNIQUE', 'Usuario para iniciar sesión.'],
            ['', 'password', 'VARCHAR(255)', 'Contraseña cifrada con bcrypt (no se puede leer).'],
            ['', 'rol', 'ENUM', 'Administradora, Estilista o Clienta.'],
            ['', 'telefono, email', 'VARCHAR', 'Contacto; sirve para recuperar la contraseña.'],
            ['clientas', 'id_clienta', 'INT PK', 'Identificador de la clienta.'],
            ['', 'id_usuario', 'INT FK UNIQUE', 'Cuenta asociada (puede estar vacía).'],
            ['', 'nombres, apellidos, telefono, email, profesion', 'VARCHAR', 'Datos de la clienta.'],
            ['estilistas', 'id_estilista', 'INT PK', 'Identificador de la estilista.'],
            ['', 'especialidad, estado', 'VARCHAR, ENUM', 'Especialidad y si está Activo o Inactivo.'],
            ['servicios', 'id_servicio', 'INT PK', 'Identificador del servicio.'],
            ['', 'precio, duracion_min', 'DECIMAL(10,2), INT', 'Precio y duración en minutos.'],
            ['', 'publico', 'ENUM', 'Mujer, Hombre o Unisex (filtro de la página Servicios).'],
            ['estilista_servicios', 'id_estilista, id_servicio', 'INT PK FK', 'Qué servicios sabe hacer cada estilista.'],
            ['citas', 'id_cita', 'INT PK', 'Identificador de la cita.'],
            ['', 'id_cliente, id_estilista, id_servicio', 'INT FK', 'Clienta, estilista y servicio.'],
            ['', 'fecha, hora', 'DATE, TIME', 'Inicio de la cita.'],
            ['', 'precio', 'DECIMAL(10,2)', 'Precio del día en que se agendó (se conserva aunque el servicio suba).'],
            ['', 'estado', 'ENUM', 'Pendiente, Confirmada, Finalizada o Cancelada.'],
            ['', 'notas_servicio, reprogramaciones', 'VARCHAR(500), TINYINT', 'Notas de la estilista y veces reprogramada (máximo 1).'],
            ['horarios', 'id_estilista, dia_semana', 'INT FK, TINYINT', 'Día de la semana (0 = domingo … 6 = sábado).'],
            ['', 'hora_inicio, hora_fin', 'TIME', 'Jornada de ese día.'],
            ['ausencias', 'fecha_inicio, fecha_fin, motivo', 'DATE, VARCHAR', 'Días en que la estilista no atiende.'],
            ['calificaciones', 'id_cita', 'INT FK UNIQUE', 'Cita calificada (una sola vez).'],
            ['', 'estrellas, comentario', 'TINYINT, VARCHAR(300)', 'De 1 a 5 y comentario opcional.'],
            ['mensajes_cita', 'id_cita, autor, texto, leido', 'INT FK, ENUM, VARCHAR, BOOLEAN', 'Chat entre clienta y estilista.'],
            ['pagos', 'id_pago', 'INT PK', 'Identificador del pago.'],
            ['', 'id_cita', 'INT FK UNIQUE', 'Cita pagada.'],
            ['', 'referencia', 'VARCHAR(30) UNIQUE', 'Código de la transacción, por ejemplo TXN-13389844.'],
            ['', 'metodo', 'ENUM', 'Bre-B o Efectivo / Salón (también Nequi, Tarjeta y PSE de versiones anteriores).'],
            ['', 'monto', 'DECIMAL(10,2)', 'Valor tomado de la cita, nunca del navegador.'],
            ['', 'estado', 'ENUM', 'Pagado, Por verificar, Pendiente en Salón, Rechazado o Reembolsado.'],
            ['', 'comprobante', 'VARCHAR(40)', 'Número de la transferencia Bre-B que escribe la clienta.'],
            ['pago_salon', 'id', 'TINYINT PK', 'Siempre 1: hay una sola configuración de cobro.'],
            ['', 'llave, titular', 'VARCHAR', 'Llave Bre-B y nombre del titular (opcionales).'],
            ['', 'qr_tipo, qr_datos', 'VARCHAR, MEDIUMBLOB', 'Imagen del QR de Bre-B del salón.'],
            ['pedidos', 'id_pedido, id_clienta', 'INT PK, INT FK', 'Pedido y clienta que lo hizo.'],
            ['', 'total, estado', 'DECIMAL, ENUM', 'Total y estado: Pendiente, Listo para recoger, Entregado o Cancelado.'],
            ['pedido_items', 'id_pedido, id_producto', 'INT FK', 'Producto pedido (se borra si se borra el pedido).'],
            ['', 'cantidad, precio', 'INT, DECIMAL(10,2)', 'Unidades y precio del momento de la compra.'],
            ['productos', 'precio, stock, estado', 'DECIMAL, INT, ENUM', 'Precio, unidades disponibles y Activo o Inactivo.'],
            ['fotos_servicio', 'id_servicio, tipo, datos', 'INT FK, VARCHAR, MEDIUMBLOB', 'Hasta 6 fotos por servicio.'],
            ['fotos_producto', 'id_producto, tipo, datos', 'INT PK FK, VARCHAR, MEDIUMBLOB', 'Una foto por producto.'],
            ['fotos_perfil', 'id_usuario, tipo, datos', 'INT PK FK, VARCHAR, MEDIUMBLOB', 'Una foto de perfil por cuenta.'],
            ['vitrina', 'id_usuario, datos, descripcion', 'INT FK, MEDIUMBLOB, VARCHAR', 'Fotos de trabajos publicadas.'],
            ['conversaciones', 'codigo, nombre, contacto, estado', 'CHAR(32) UNIQUE, VARCHAR, ENUM', 'Chat de un visitante, reconocido por un código aleatorio.'],
            ['mensajes', 'id_conversacion, autor, texto, leido', 'INT FK, ENUM, VARCHAR, BOOLEAN', 'Mensajes del visitante, de Bella o del salón.'],
            ['migraciones', 'nombre, aplicada', 'VARCHAR(60) PK, TIMESTAMP', 'Cambios de datos ya aplicados para no repetirlos.'],
        ], anchos=[1.2, 1.7, 1.5, 2.1], tam=9)
D.titulo('Decisiones de diseño de la base de datos', 2)
D.lista([
    '**Precio histórico.** ~citas.precio~ y ~pedido_items.precio~ guardan el valor del día de la compra. Si mañana sube el precio, lo ya cobrado no cambia. No es una duplicación: es un dato histórico.',
    '**Normalización.** Cada columna guarda un solo valor (primera forma normal), no hay datos que dependan solo de una parte de una llave compuesta (segunda) y no se repiten datos que se puedan traer con una llave foránea (tercera).',
    '**Imágenes en la base.** Las fotos y el QR se guardan como MEDIUMBLOB porque el disco del servidor gratuito de Render se borra en cada reinicio. El servidor revisa el tipo real de la imagen y que no pase de 1,5 MB.',
    '**Transacciones.** El registro, crear una cita, guardar el horario, asignar servicios a una estilista, crear un pedido y cambiar su estado se hacen en transacciones: se guarda todo o nada.',
    '**Citas simultáneas.** Al crear una cita se bloquean las filas de la clienta y de las estilistas posibles con SELECT … FOR UPDATE, así dos personas no pueden quedarse con la misma hora.',
])
D.titulo('Actualización automática de la base', 2)
D.parrafo('Cada vez que el servidor arranca ejecuta ~actualizar_bd.js~, que crea las tablas y columnas que falten sin borrar datos. Algunos cambios son de datos y deben hacerse una sola vez; para eso existe la tabla ~migraciones~. Por ejemplo, la migración «domingos-hasta-15» abrió el domingo de 8:00 a 15:00 para las estilistas existentes, y «fotos-servicios-iniciales» y «fotos-productos-iniciales» cargaron las fotos de la carpeta ~img~ en los servicios y productos que no tenían foto.')

# ------------------------------------------------------------------ 7
D.salto()
D.titulo('Descripción de la plataforma', 1)
D.parrafo('BellaStyle Manager es una aplicación web **cliente-servidor**: el navegador (cliente) muestra las pantallas y el servidor guarda y entrega los datos. La Tabla 8 resume las tecnologías usadas y por qué se eligieron.')
D.tabla('Tecnologías del proyecto y razón de su elección',
        ['Tecnología', 'Versión', 'Para qué se usa', 'Por qué se eligió'],
        [
            ['HTML, CSS y JavaScript', '—', 'Pantallas del navegador', 'Funcionan en cualquier navegador sin instalar nada.'],
            ['Tailwind CSS', '3.4', 'Diseño, celular y modo claro u oscuro', 'Permite un diseño propio y adaptable (Tailwind Labs, s. f.).'],
            ['Node.js y Express', '20 y 4.x', 'Servidor y API REST', 'Un solo lenguaje (JavaScript) en todo el sistema (OpenJS Foundation, s. f.-a, s. f.-b).'],
            ['MySQL', '8.4', 'Base de datos relacional', 'Los datos tienen relaciones, llaves y transacciones.'],
            ['mysql2', '3.x', 'Conexión a MySQL', 'Grupo de conexiones reutilizables y consultas con parámetros (?).'],
            ['bcryptjs', '2.4', 'Cifrar contraseñas', 'Algoritmo lento a propósito, difícil de romper.'],
            ['jsonwebtoken', '9.0', 'Token de sesión (JWT)', 'Sesión que no se pierde cuando el servidor se reinicia.'],
            ['pdfkit', '0.15', 'Comprobante PDF', 'El PDF se ve igual en cualquier equipo.'],
            ['Gemini API', 'v1beta', 'Inteligencia artificial de Bella', 'Respuestas naturales con plan gratuito (Google, s. f.).'],
            ['Render', 'Plan gratuito', 'Publicar el servidor en internet', 'Publica desde GitHub con HTTPS (Render, s. f.).'],
            ['Aiven for MySQL', '8.4', 'Base de datos en la nube', 'MySQL administrado, gratuito y con SSL (Aiven, s. f.).'],
            ['Docker', 'node:20-alpine', 'Ejecutar todo en local con un comando', 'Mismo entorno en cualquier computador (Docker, s. f.).'],
            ['Git y GitHub', '—', 'Control de versiones y trabajo en equipo', 'Historial de cambios y colaboración.'],
            ['Bre-B', '—', 'Cobro con QR o llave', 'Pagos inmediatos entre bancos sin comisión para personas (Banco de la República, s. f.).'],
        ], anchos=[1.4, 0.9, 1.9, 2.3], tam=9.5)
D.titulo('Por qué no se usaron otras tecnologías', 2)
D.lista([
    '**Spring Boot.** Para este proyecto de aula era opcional. Se prefirió Node.js para usar un solo lenguaje; la organización en capas es la misma (rutas como ~controllers~, controladores como ~services~ y modelos como ~repositories~).',
    '**Una aplicación móvil nativa.** La web se adapta al celular. Como el servidor ofrece una API REST, una app futura podría usar las mismas rutas sin cambiar el servidor.',
    '**Una pasarela de pagos (Wompi, PayU).** Exige registrar un comercio y cobra comisión por cada pago. Bre-B es lo que ya usan las clientas.',
    '**Integración continua (GitHub Actions).** Todavía no hay pruebas automáticas que ejecutar. Sí hay despliegue continuo: Render publica cada cambio de la rama main.',
])
D.titulo('Requisitos para instalar en un computador', 2)
D.lista([
    'Windows 10 u 11 (también Linux o macOS), 4 GB de RAM y 1 GB libre en disco.',
    'Node.js 18 o superior y MySQL Server 8.',
    'Git, para descargar el código, y un editor como Visual Studio Code. Para revisar la base, MySQL Workbench.',
], numerada=False)
D.titulo('Instalación paso a paso', 2)
D.lista([
    'Descargar el código: ~git clone https://github.com/cesar-pestana26/bellastyle-manager.git~',
    'Crear la base de datos: ejecutar ~proaula_bella/INSTALAR_BASE_DE_DATOS.bat~ (crea las 22 tablas y datos de prueba).',
    'Crear el archivo ~proaula_bella/backend/.env~ con DB_USER, DB_PASSWORD y, si se quiere el chat con IA, GEMINI_API_KEY. Este archivo nunca se sube a GitHub.',
    'Instalar las librerías: en ~proaula_bella/backend~ ejecutar ~npm install~.',
    'Arrancar el servidor: ~node app.js~. Debe aparecer «Base de datos actualizada (22 tablas)» y «Servidor en http://localhost:3000».',
    'Abrir http://localhost:3000 en el navegador.',
], numerada=True)
D.parrafo('**Con Docker.** En la carpeta ~proaula_bella~ ejecutar ~docker compose up --build~. Se levantan dos contenedores: MySQL 8.0, que se llena solo con ~init_db.sql~, y la aplicación con Node 20.')
D.titulo('Publicación en la nube', 2)
D.lista([
    'Subir los cambios a GitHub: ~git push~ a la rama main.',
    'En Render, el servicio «bellastyle» descarga el código, ejecuta ~npm install~ y arranca ~node app.js~ (carpeta ~proaula_bella/backend~). Si no lo hace solo, se usa Manual Deploy → Deploy latest commit.',
    'Las claves van en la sección Environment de Render: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL, GEMINI_API_KEY, CODIGO_ADMIN y JWT_SECRETO. Nunca se escriben en el código.',
    'La base de datos se actualiza sola al arrancar; no hay que ejecutar nada en Aiven.',
], numerada=True)

# ------------------------------------------------------------------ 8
D.salto()
D.titulo('Documentación del código fuente', 1)
D.titulo('Arquitectura en capas', 2)
D.parrafo('El servidor está organizado en capas: **rutas → controladores → modelos → base de datos**. Las rutas reciben la petición y revisan la seguridad; los controladores aplican las reglas del negocio; solo los modelos escriben SQL. Así, si mañana se cambia la base de datos, solo se tocan los modelos.')
D.tabla('Estructura de carpetas del proyecto',
        ['Carpeta', 'Contenido'],
        [
            ['proaula_bella/backend', 'Servidor. app.js lo arranca, sirve las páginas y monta la API en /api.'],
            ['backend/config', 'Configuración (puerto, conexión a MySQL, claves) y grupo de conexiones.'],
            ['backend/routes', 'rutas.js: las 68 direcciones de la API y quién puede usar cada una.'],
            ['backend/middleware', 'seguridad.js: token de sesión, permisos por rol, dueño de cada dato y límite de intentos.'],
            ['backend/controllers', 'Reglas del negocio (13 archivos).'],
            ['backend/models', 'Consultas SQL de cada tabla (14 archivos).'],
            ['backend/utils', 'Validaciones, agenda, imágenes y asistentes del chat.'],
            ['proaula_bella/frontend', 'Páginas HTML que ve el usuario (10 páginas).'],
            ['frontend/js', 'Lógica del navegador (20 archivos), por ejemplo pagos.js y tienda.js.'],
            ['proaula_bella/img', 'Fotos iniciales de servicios y productos (se cargan solas en la base).'],
            ['docs', 'Manuales, diagramas y sus fuentes.'],
        ], anchos=[1.9, 4.6])
D.titulo('Programas principales', 2)
D.tabla('Archivos principales y lo que hace cada uno',
        ['Archivo', 'Qué hace'],
        [
            ['backend/app.js', 'Arranca Express, actualiza la base, sirve el frontend y monta la API. La dirección / lleva a welcome.html.'],
            ['config/db.js', 'Grupo de 10 conexiones a MySQL, con SSL en producción.'],
            ['routes/rutas.js', '68 rutas: 28 GET, 16 POST, 19 PUT y 5 DELETE.'],
            ['middleware/seguridad.js', 'crearToken, requiereSesion, soloRoles, duenoDeCita y límite de 3 intentos con 3 minutos de bloqueo.'],
            ['controllers/authController.js', 'Iniciar sesión, registrarse y recuperar la contraseña.'],
            ['controllers/citasController.js', 'Horas libres, crear cita (transacción con bloqueo), reprogramar, estados, notas e historial.'],
            ['controllers/pagoController.js', 'Pago con Bre-B o en el salón, confirmación de la administradora y configuración del QR.'],
            ['controllers/pedidoController.js', 'Pedidos de la tienda: descuenta y devuelve unidades en una transacción.'],
            ['controllers/chatController.js', 'Chat de visitantes con Bella y respuestas de la administradora.'],
            ['controllers/comprobanteController.js', 'Comprobante PDF de la cita con pdfkit.'],
            ['utils/agenda.js', 'Horarios: apertura 8:00, cierre 19:00 (domingo 15:00) y cálculo de cruces.'],
            ['utils/asistenteIA.js', 'Bella: arma las instrucciones con datos reales del salón y llama a Gemini.'],
            ['utils/validators.js', 'Validación de nombre, usuario, contraseña, teléfono y correo.'],
            ['actualizar_bd.js', 'Crea tablas y columnas faltantes y aplica migraciones de datos una sola vez.'],
            ['init_db.sql', 'Crea la base desde cero con datos de prueba.'],
            ['frontend/js/api.js', 'Función pedir(): llama a la API y envía el token en cada petición.'],
            ['frontend/js/pagos.js', 'Ventana de pago (Bre-B o en el salón), QR en grande y comprobante.'],
            ['frontend/js/tienda.js y catalogo.js', 'Productos, carrito guardado en el navegador y pedido.'],
            ['frontend/js/admin.js', 'Panel de la administradora.'],
            ['frontend/js/panel.js', 'Panel de la clienta y de la estilista.'],
        ], anchos=[2.3, 4.2])
D.titulo('Cómo funciona el pago con Bre-B', 2)
D.parrafo('Bre-B es el sistema de pagos inmediatos del Banco de la República: permite enviar dinero entre bancos y billeteras en segundos con una llave o un código QR (Banco de la República, s. f.). En BellaStyle no hay una pasarela externa; el módulo de pago es propio y funciona así:')
D.lista([
    'La administradora sube la imagen del QR de su cuenta (y, si quiere, la llave y el titular). Se guarda en la tabla ~pago_salon~.',
    'La clienta abre la ventana de pago desde su panel (~pagos.js~, función ~abrirPasarelaPago~) y elige Bre-B o En el salón. En ambas opciones ve el QR, con botones para verlo en grande o descargarlo.',
    'Con Bre-B paga desde la app de su banco y escribe el número del comprobante. El servidor (~pagoController.crear~) guarda el pago como **Por verificar**. En el salón, queda **Pendiente en Salón**.',
    'El monto siempre se toma de la cita guardada en la base de datos, nunca de lo que envíe el navegador, para que nadie pueda cambiarlo.',
    'La administradora revisa su banco y marca el pago: «Llegó: confirmar» o «No llegó» para Bre-B; «Cobrado: efectivo» o «Cobrado: QR» para los pagos en el salón. El pago pasa a **Pagado** o **Rechazado**.',
], numerada=True)
D.titulo('Cómo se calculan las horas libres', 2)
D.parrafo('El servidor recorre el día de 30 en 30 minutos, desde las 8:00 hasta el cierre (19:00 de lunes a sábado y 15:00 el domingo). Una hora se muestra solo si alguna estilista que sabe hacer el servicio trabaja ese día, no está ausente, termina antes de su hora de salida y no tiene otra cita que se cruce. Dos citas se cruzan cuando una empieza antes de que termine la otra y viceversa:')
D.parrafo('~function seCruzan(inicioA, finA, inicioB, finB) { return inicioA < finB && inicioB < finA; }~', sangria=False, alinear='centro')
D.titulo('Seguridad', 2)
D.lista([
    'Contraseñas cifradas con bcrypt; nunca se guardan ni se muestran tal como se escriben.',
    'Token JWT firmado y permisos por rol en cada ruta (sin sesión: error 401; sin permiso: error 403).',
    'Protección anti-IDOR: el servidor toma la identidad del token, no de lo que mande el navegador, y revisa que cada cita, pago u horario sea de quien lo pide.',
    'Consultas parametrizadas con «?», que evitan la inyección SQL.',
    'Textos escapados antes de mostrarlos, que evitan la inyección de código en la página (XSS).',
    'Validación de datos en el navegador y otra vez en el servidor (el nombre solo acepta letras; el teléfono, 10 dígitos).',
    'Claves fuera del código, en variables de entorno, y conexiones cifradas (HTTPS y SSL).',
])

# ------------------------------------------------------------------ 9
D.titulo('Mantenimiento y solución de problemas', 1)
D.tabla('Problemas frecuentes y cómo resolverlos',
        ['Síntoma', 'Causa', 'Solución'],
        [
            ['La página publicada tarda casi un minuto en abrir.', 'El plan gratuito de Render apaga el servidor cuando no hay visitas.', 'Esperar; la primera carga lo despierta. Abrirla unos minutos antes de una presentación.'],
            ['Error MODULE_NOT_FOUND al arrancar.', 'Faltan librerías en el computador.', 'Ejecutar npm install en proaula_bella/backend.'],
            ['Error EADDRINUSE :3000.', 'El servidor ya está abierto en otra ventana.', 'Usar el que está abierto o cerrarlo con Ctrl + C.'],
            ['No conecta a la base de datos.', 'MySQL apagado o claves incorrectas.', 'Encender MySQL; revisar DB_USER y DB_PASSWORD en .env o en Render.'],
            ['Bella responde de forma muy básica.', 'Falta la clave de Gemini o la IA no respondió.', 'Revisar GEMINI_API_KEY; mientras tanto responde el asistente de respaldo.'],
            ['Un cambio no aparece en la página publicada.', 'Render no desplegó o el navegador guardó la versión anterior.', 'Hacer Manual Deploy en Render y recargar con Ctrl + F5.'],
            ['git push es rechazado.', 'Otro integrante subió cambios antes.', 'Hacer git pull, revisar y volver a hacer git push.'],
        ], anchos=[1.9, 2.0, 2.6])

# ------------------------------------------------------------------ 10
D.titulo('Acuerdos de niveles de servicio', 1)
D.parrafo('Los acuerdos de niveles de servicio (ANS) dicen en cuánto tiempo se responde y se soluciona un problema según su gravedad.')
D.tabla('Tiempos de respuesta y solución según la prioridad',
        ['Prioridad', 'Ejemplo', 'Respuesta', 'Solución'],
        [
            ['Alta', 'El servidor no arranca o no hay conexión con la base; nadie puede entrar.', '1 hora', '4 horas'],
            ['Media', 'Una función falla (agendar, pagar, editar).', '4 horas', '1 día hábil'],
            ['Baja', 'Dudas de uso, cambios de textos o mejoras.', '1 día hábil', '3 días hábiles'],
        ], anchos=[0.9, 3.4, 1.0, 1.2])
D.parrafo('**Escalamiento.** El primer nivel es la administradora del salón: resuelve cuentas, precios, fotos y datos desde su panel. Si no puede, escala al segundo nivel (soporte técnico), que revisa el servidor, la base de datos y el código.')

# ------------------------------------------------------------------ 11
D.titulo('Glosario', 1)
for t in [
    '**API REST:** conjunto de direcciones por las que el navegador pide y envía datos al servidor en formato JSON.',
    '**bcrypt:** algoritmo que convierte la contraseña en un texto que no se puede revertir.',
    '**Bre-B:** sistema de pagos inmediatos de Colombia que funciona con llaves y códigos QR.',
    '**Despliegue:** publicar el sistema en un servidor para que se pueda usar desde internet.',
    '**Docker:** herramienta que empaqueta la aplicación con todo lo que necesita para que funcione igual en cualquier equipo.',
    '**Fuerza bruta:** ataque que prueba muchas contraseñas seguidas; se frena con el límite de 3 intentos.',
    '**JWT (JSON Web Token):** texto firmado por el servidor que dice quién inició sesión y con qué rol.',
    '**Llave foránea (FK):** columna que apunta a una fila de otra tabla y mantiene la relación entre ambas.',
    '**Middleware:** función que revisa algo (como la sesión) antes de que la petición llegue al controlador.',
    '**Migración:** cambio en la estructura o los datos de la base que se aplica automáticamente.',
    '**Transacción:** grupo de operaciones en la base de datos que se guardan todas juntas o ninguna.',
    '**UML:** lenguaje gráfico estándar para diseñar sistemas de software.',
    '**Variable de entorno:** valor de configuración, como una contraseña, guardado fuera del código.',
]:
    D.parrafo(t, sangria=False)

D.referencias(REFS_TECNICO)
print(D.guardar(SALIDA))
