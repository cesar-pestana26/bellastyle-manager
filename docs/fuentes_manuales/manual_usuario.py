# Genera el Manual de Usuario de BellaStyle Manager en Word y PDF con normas APA 7.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(sys.argv[0])))
from apa import DocAPA
from portada import AUTORES, INSTITUCION, CURSO, PROFESOR, FECHA
from refs import REFS_USUARIO

S = sys.argv[1]            # carpeta de capturas
SALIDA = sys.argv[2]
D = DocAPA()
def img(n): return os.path.join(S, n + '.jpg')

D.portada('Manual de Usuario de BellaStyle Manager',
          'Guía paso a paso para clientas, estilistas y administradora',
          AUTORES, INSTITUCION, CURSO, PROFESOR, FECHA)
D.indice()

# ------------------------------------------------------------------
D.titulo('Introducción', 1)
D.parrafo('BellaStyle Manager es la página web del salón de belleza BellaStyle. Desde ella las clientas conocen los servicios, agendan sus citas, las pagan y compran productos; las estilistas organizan su agenda; y la administradora maneja todo el salón desde un solo lugar.')
D.parrafo('Este manual explica, paso a paso y con imágenes, cómo usar cada pantalla. No hace falta saber de computadores: basta con seguir los pasos en orden. Sigue la estructura recomendada para documentación de usuario (Institute of Electrical and Electronics Engineers [IEEE], 2001) y la guía del SENA (Servicio Nacional de Aprendizaje, s. f.).')
D.titulo('Cómo está organizado este manual', 2)
D.lista([
    '**Antes de empezar:** qué se necesita y cómo entrar.',
    '**Para todos:** la página de inicio, los servicios, la galería, la tienda y el chat con Bella.',
    '**Cuenta:** crear cuenta, iniciar sesión y recuperar la contraseña.',
    '**Clienta, Estilista y Administradora:** una sección para cada rol.',
    '**Preguntas frecuentes** y glosario al final.',
])

D.titulo('Antes de empezar', 1)
D.titulo('Qué se necesita', 2)
D.lista([
    'Un celular, tableta o computador con conexión a internet.',
    'Un navegador actualizado: Google Chrome, Microsoft Edge, Mozilla Firefox o Safari.',
    'Para pagar con Bre-B: la app de un banco o billetera (Nequi, Daviplata, Bancolombia u otra).',
])
D.titulo('Cómo entrar', 2)
D.parrafo('Escriba en el navegador la dirección **https://bellastyle.onrender.com**. Si la página tarda hasta un minuto en abrir la primera vez, es normal: el servidor gratuito se «duerme» cuando no hay visitas y despierta solo.')
D.titulo('Modo claro y modo oscuro', 2)
D.parrafo('En la parte de arriba de cada página hay un botón con un sol o una luna. Al tocarlo, la página cambia entre colores claros y oscuros. La elección se recuerda en ese dispositivo. Las imágenes de este manual se tomaron en modo claro.')

# ------------------------------------------------------------------
D.salto()
D.titulo('Para todos los visitantes', 1)
D.titulo('Página de inicio', 2)
D.parrafo('Es lo primero que se ve al abrir la dirección. Presenta el salón, su horario (lunes a sábado de 8:00 a 19:00 y domingo de 8:00 a 15:00), los servicios con sus precios, el equipo de estilistas, fotos de trabajos y productos. El menú de arriba lleva a **Inicio, Servicios, Galería y Tienda**; a la derecha están el carrito, el botón de modo claro u oscuro, **Iniciar sesión** y **Crear cuenta**.')
D.figura(img('01_inicio'), 'Página de inicio del salón')
D.figura(img('02_inicio_servicios'), 'Servicios y precios en la página de inicio')
D.titulo('Ver los servicios', 2)
D.lista([
    'Toque **Servicios** en el menú.',
    'Use el filtro **Todos, Mujer, Hombre o Unisex** para ver solo los servicios que le interesan.',
    'Toque un servicio de la lista: a la derecha aparecen su precio, su duración y fotos reales.',
    'Toque **Agendar este servicio** para pedir la cita.',
], numerada=True)
D.figura(img('03_servicios'), 'Página de servicios con el detalle de un servicio')
D.titulo('Ver la galería', 2)
D.parrafo('En **Galería** están las fotos de trabajos del salón. Toque una foto para verla en grande.')
D.figura(img('04_galeria'), 'Galería de trabajos')
D.titulo('Comprar en la tienda', 2)
D.lista([
    'Toque **Tienda** en el menú. Cada producto muestra su foto, su precio y las unidades disponibles.',
    'Toque **Agregar** en los productos que quiera. El número del carrito, arriba, aumenta.',
    'Toque **Ver carrito**. Con los botones **+** y **−** cambia las cantidades.',
    'Toque **Hacer pedido**. Si no ha iniciado sesión, el sistema le pide entrar como clienta y guarda su carrito.',
    'El pedido se recoge y se paga en el salón. Su estado aparece en **Mis pedidos** dentro de su panel.',
], numerada=True)
D.figura(img('05_tienda'), 'Tienda con los productos del salón')
D.figura(img('06_carrito'), 'Carrito de compras abierto')
D.titulo('Hablar con Bella', 2)
D.parrafo('Bella es la asistente virtual del salón. Responde con inteligencia artificial preguntas sobre precios, horarios, servicios y cómo agendar, usando la información real del salón. Toque la burbuja de chat (abajo a la derecha), escriba su nombre y su teléfono o correo, y haga su pregunta. Si necesita a una persona, la administradora puede contestar por el mismo chat.')
D.figura(img('07_chat_bella'), 'Chat con Bella abierto en la página de inicio')

# ------------------------------------------------------------------
D.salto()
D.titulo('Cuenta de usuario', 1)
D.titulo('Crear una cuenta', 2)
D.lista([
    'Toque **Crear cuenta** en el menú.',
    'Elija el rol: **Clienta** (lo normal), Estilista o Administradora (esta última pide un código del salón).',
    'Escriba su **nombre completo** (solo letras y espacios), un **usuario** sin espacios y una **contraseña** de mínimo 6 caracteres.',
    'Escriba su **teléfono** (10 dígitos) o su **correo**. Basta con uno; lo necesitará si olvida la contraseña.',
    'La profesión es opcional. Toque **Crear mi cuenta**.',
], numerada=True)
D.figura(img('09_registro'), 'Formulario para crear una cuenta')
D.titulo('Iniciar sesión', 2)
D.lista([
    'Toque **Iniciar sesión** en el menú.',
    'Elija su rol: Clienta, Estilista o Administradora.',
    'Escriba su usuario y su contraseña. El **ojito** del campo de contraseña muestra u oculta lo que escribió.',
    'Toque **Entrar**. El sistema lo lleva a su panel.',
], numerada=True)
D.figura(img('08_login'), 'Pantalla para iniciar sesión')
D.parrafo('**Por seguridad,** si se escribe mal la contraseña 3 veces seguidas, hay que esperar 3 minutos para volver a intentarlo. La sesión dura 8 horas; después hay que entrar de nuevo.')
D.titulo('Recuperar la contraseña', 2)
D.lista([
    'En la pantalla de inicio de sesión, toque **¿Olvidaste tu contraseña?**',
    'Escriba su usuario y el teléfono o correo con el que se registró.',
    'Escriba la nueva contraseña dos veces y toque **Cambiar contraseña**.',
    'Entre con la contraseña nueva. Si su cuenta estaba bloqueada por intentos fallidos, el bloqueo se quita al recuperar la contraseña.',
], numerada=True)
D.figura(img('10_recuperar'), 'Pantalla para recuperar la contraseña')
D.titulo('Cerrar sesión y cambiar la foto', 2)
D.parrafo('En cualquier panel, toque su nombre arriba a la derecha: se abre un menú con **Ir al Inicio** y **Cerrar Sesión**. La clienta y la estilista cambian su foto con el botón de cámara junto a su imagen y la quitan con **Quitar foto**; la administradora lo hace desde ese mismo menú.')

# ------------------------------------------------------------------
D.salto()
D.titulo('Guía para la clienta', 1)
D.titulo('Su panel', 2)
D.parrafo('Al entrar ve su saludo, sus datos personales (que puede editar con **Editar**), la tabla **Mis Citas, Pagos, Chat y Calificaciones**, sus pedidos de la tienda y las estilistas del salón con sus trabajos.')
D.figura(img('11_panel_clienta'), 'Panel de la clienta')
D.titulo('Agendar una cita', 2)
D.lista([
    'Toque **+ Agendar Cita** (arriba) o **Agendar mi cita** en la página de inicio.',
    '**Paso 1:** elija el servicio. Puede filtrar por Mujer, Hombre o Unisex.',
    '**Paso 2:** elija una estilista o deje **Cualquiera Disponible**: el sistema asigna la que esté libre y tenga menos citas ese día.',
    '**Paso 3:** elija la fecha. Aparecen **solo las horas libres**. Los domingos se atiende hasta las 3:00 p. m.',
    'Escriba notas si quiere (por ejemplo, «quiero un corte en capas») y toque **Confirmar Cita**.',
], numerada=True)
D.figura(img('13_agendar_paso1'), 'Agendar cita: paso 1, elegir el servicio')
D.figura(img('14_agendar_horas'), 'Agendar cita: paso 3, fecha y horas libres')
D.titulo('Pagar una cita', 2)
D.parrafo('En la tabla de sus citas toque **Pagar**. Se abre la ventana de pago con el resumen de la cita y dos opciones.')
D.titulo('Opción 1: Bre-B desde su celular', 3)
D.lista([
    'Elija **Bre-B (QR o llave)**. Aparece el código QR del salón.',
    'Abra la app de su banco o billetera y escanee el QR, o use la llave que aparece. Si paga desde el mismo celular, toque **Descargar** y en su banco elija «pagar con QR desde la galería». Si lo escanea desde un computador, toque **Ver grande**.',
    'Pague el valor exacto que muestra la ventana.',
    'Copie el **número del comprobante** que le da su banco, escríbalo en la casilla y toque **Ya pagué, enviar comprobante**.',
    'Su pago queda **Por verificar** hasta que el salón vea la transferencia y lo confirme.',
], numerada=True)
D.figura(img('15_pago_breb'), 'Ventana de pago con Bre-B: QR y número del comprobante')
D.titulo('Opción 2: pagar en el salón', 3)
D.parrafo('Elija **En el salón** y toque **Pagar en el salón**. El día de la cita paga en efectivo o escaneando el mismo QR, que también aparece en su comprobante. No tiene que enviar comprobante: el salón confirma el pago allá. El pago queda **Pendiente en Salón**.')
D.figura(img('16_pago_salon'), 'Ventana de pago con la opción En el salón')
D.figura(img('17_comprobante_salon'), 'Comprobante de un pago pendiente en el salón, con el QR', ancho=3.6)
D.tabla('Estados de un pago y lo que significan',
        ['Estado', 'Qué significa'],
        [
            ['Por verificar', 'Usted envió el comprobante de Bre-B; el salón está revisando su banco.'],
            ['Pendiente en Salón', 'Pagará el día de la cita en el salón.'],
            ['Pagado', 'El salón confirmó que recibió el dinero.'],
            ['Rechazado', 'La transferencia no llegó. Revise el número del comprobante y vuelva a enviarlo.'],
        ], anchos=[1.7, 4.8], tam=11)
D.titulo('Otras acciones con sus citas', 2)
D.lista([
    '**Chat:** conversar con la estilista de esa cita. El número rojo indica mensajes nuevos.',
    '**Reprogramar:** cambiar la fecha u hora una sola vez por cita.',
    '**Cancelar:** anular la cita si no puede asistir.',
    '**Calificar:** cuando la cita está finalizada, dar de 1 a 5 estrellas y un comentario.',
    '**PDF:** descargar el comprobante del servicio finalizado.',
])
D.figura(img('18_chat_cita'), 'Chat entre la clienta y la estilista de una cita')
D.titulo('Mis pedidos', 2)
D.parrafo('En **Mis pedidos de la tienda** ve cada pedido con sus productos, el total y su estado: Pendiente, Listo para recoger, Entregado o Cancelado.')
D.figura(img('19_mis_pedidos'), 'Pedidos de la tienda en el panel de la clienta')

# ------------------------------------------------------------------
D.salto()
D.titulo('Guía para la estilista', 1)
D.titulo('Su panel', 2)
D.parrafo('Muestra el total de sus citas, las pendientes, las finalizadas y su comisión (60 % de los servicios finalizados), además de su calificación, su horario y su vitrina de trabajos.')
D.figura(img('20_panel_estilista'), 'Panel de la estilista')
D.titulo('Atender las citas', 2)
D.lista([
    'En **Agenda de Citas Asignadas** toque **Confirmar** cuando acepte una cita.',
    'Use **Chat** para hablar con la clienta.',
    'Al terminar el servicio toque **Finalizar** y escriba las **notas** (productos, tono, técnica). Quedan en el historial de la clienta.',
    'Si no puede atender, toque **Cancelar**.',
], numerada=True)
D.figura(img('23_citas_estilista'), 'Agenda de citas asignadas a la estilista')
D.titulo('Horario y ausencias', 2)
D.parrafo('Toque **Editar** en **Mi Horario y Ausencias**. Marque los días que trabaja y la hora de entrada y salida de cada uno (de lunes a sábado hasta las 19:00 y el domingo hasta las 15:00). Con **Ausencias** registra vacaciones o permisos: esos días el sistema no le asigna citas.')
D.figura(img('21_horario'), 'Ventana para editar el horario semanal')
D.titulo('Vitrina de trabajos', 2)
D.parrafo('En **Mi Vitrina de Trabajos** toque **+ Agregar foto**, elija una imagen de un trabajo suyo y escriba una descripción corta. Las fotos aparecen en la galería del salón.')
D.figura(img('22_vitrina'), 'Vitrina de trabajos de la estilista')

# ------------------------------------------------------------------
D.salto()
D.titulo('Guía para la administradora', 1)
D.titulo('Centro de control', 2)
D.parrafo('Arriba están los indicadores: total de citas, ingresos brutos, ganancia del salón (40 %) y comisiones de las estilistas (60 %). Debajo hay pestañas para cada tarea. La primera, **Control Total de Citas**, permite filtrar por estado, estilista o nombre y confirmar, cancelar o ver el PDF de cualquier cita.')
D.figura(img('24_admin_citas'), 'Centro de control de la administradora')
D.titulo('Pagos y QR de Bre-B', 2)
D.lista([
    'Abra la pestaña **Pagos**.',
    'En **Cobro con Bre-B** toque **Elegir archivo** y suba la imagen del QR que le da su banco. Verá una vista previa. La llave y el titular son opcionales. Toque **Guardar datos de cobro**.',
    'En la tabla de pagos, para los pagos **Por verificar**, revise su banco y toque **Llegó: confirmar** o **No llegó**.',
    'Para los pagos **Pendiente en Salón**, cuando la clienta pague toque **Cobrado: efectivo** o **Cobrado: QR**, según cómo pagó.',
], numerada=True)
D.figura(img('25_admin_pagos'), 'Pestaña de pagos: QR de Bre-B y confirmación de pagos')
D.titulo('Pedidos de la tienda', 2)
D.parrafo('En **Pedidos tienda** ve cada pedido con la clienta, los productos y el total. Con la lista de estado lo marca como **Listo para recoger**, **Entregado** o **Cancelado**. Al cancelar, las unidades vuelven al inventario.')
D.figura(img('26_admin_pedidos'), 'Pestaña de pedidos de la tienda')
D.titulo('Mensajes de Bella', 2)
D.parrafo('En **Mensajes (Chat Bella)** aparecen las conversaciones de los visitantes. El número rosado indica mensajes sin leer. Toque una conversación para leerla, escriba una respuesta o ciérrela.')
D.figura(img('27_admin_mensajes'), 'Bandeja de mensajes del chat de Bella')
D.titulo('Liquidación 60/40', 2)
D.parrafo('Muestra, por estilista, las citas finalizadas, el total recaudado, lo que le corresponde a cada estilista (60 %) y la ganancia del salón (40 %).')
D.figura(img('28_admin_liquidacion'), 'Liquidación de comisiones')
D.titulo('Servicios y fotos', 2)
D.lista([
    'En **Servicios y Fotos**, toque **+ Nuevo Servicio** para crear uno (nombre, precio, duración y público: Mujer, Hombre o Unisex).',
    '**Editar Precio** cambia el precio o los datos del servicio.',
    '**Fotos** abre la ventana de fotos: **Quitar** borra una foto y **Elegir archivos** sube nuevas (máximo 6 por servicio).',
], numerada=True)
D.figura(img('29_admin_servicios'), 'Pestaña de servicios')
D.figura(img('30_admin_fotos_servicio'), 'Ventana para agregar o quitar fotos de un servicio')
D.titulo('Productos', 2)
D.parrafo('En **Productos** crea productos con **+ Nuevo Producto**, cambia su precio y sus unidades con **Editar**, sube su foto y los activa o desactiva para que aparezcan o no en la tienda.')
D.figura(img('31_admin_productos'), 'Pestaña de productos')
D.titulo('Equipo, horarios y calificaciones', 2)
D.parrafo('Muestra las estilistas con sus servicios y su calificación. Con **Horario** edita los días y horas de trabajo de cada una, con **Ausencias** registra sus permisos o vacaciones y con **Opiniones** lee las calificaciones de sus clientas.')
D.figura(img('32_admin_equipo'), 'Pestaña del equipo de estilistas')
D.titulo('Vitrina del salón', 2)
D.parrafo('En **Vitrina** ve todas las fotos publicadas. Con **+ Agregar foto** sube nuevas; con **Editar** cambia la descripción y con **Quitar** la retira de la galería.')
D.figura(img('33_admin_vitrina'), 'Pestaña de la vitrina del salón')

# ------------------------------------------------------------------
D.titulo('Uso desde el celular', 1)
D.parrafo('Todas las páginas se adaptan al tamaño de la pantalla. En el celular, el menú se abre con el botón de tres rayas (arriba a la derecha) y las tablas se pueden deslizar hacia los lados.')
D.figura(img('34_celular_inicio'), 'Página de inicio en el celular', ancho=2.6)
D.figura(img('35_celular_menu'), 'Menú abierto en el celular', ancho=2.6)

# ------------------------------------------------------------------
D.salto()
D.titulo('Preguntas frecuentes', 1)
D.tabla('Preguntas frecuentes y soluciones',
        ['Pregunta o problema', 'Qué hacer'],
        [
            ['La página tarda mucho en abrir.', 'Espere hasta un minuto la primera vez: el servidor gratuito estaba dormido.'],
            ['Dice «Demasiados intentos fallidos».', 'Espere 3 minutos o recupere la contraseña con su teléfono o correo.'],
            ['No aparecen horas para el día que quiero.', 'Ese día no hay estilistas libres para ese servicio. Pruebe otra fecha u otra estilista.'],
            ['¿Por qué no puedo reprogramar otra vez?', 'Cada cita se reprograma una sola vez. Puede cancelarla y agendar una nueva.'],
            ['Mi pago dice «Por verificar».', 'El salón está revisando su banco. Cambiará a «Pagado» cuando lo confirme.'],
            ['Mi pago dice «Rechazado».', 'Revise el número del comprobante en su banco y vuelva a enviarlo desde Pagar.'],
            ['El QR no se deja escanear.', 'Toque «Ver grande» y acerque o aleje el celular, o descárguelo y use «pagar con QR desde la galería».'],
            ['No veo un cambio reciente.', 'Recargue la página con Ctrl + F5 (computador) o cierre y abra el navegador.'],
        ], anchos=[2.4, 4.1], tam=11)

D.titulo('Glosario', 1)
for t in [
    '**Bre-B:** sistema de pagos inmediatos de Colombia; permite transferir con una llave o un código QR (Banco de la República, s. f.).',
    '**Comprobante:** número o constancia que entrega el banco cuando se hace una transferencia.',
    '**Llave Bre-B:** dato (celular, correo o código) que identifica una cuenta para recibir pagos.',
    '**Panel:** pantalla personal de cada usuario después de iniciar sesión.',
    '**QR:** código de cuadros que se escanea con la cámara del celular.',
    '**Rol:** tipo de usuario: clienta, estilista o administradora.',
    '**Vitrina:** galería con fotos de trabajos del salón.',
]:
    D.parrafo(t, sangria=False)

D.referencias(REFS_USUARIO)
print(D.guardar(SALIDA))
