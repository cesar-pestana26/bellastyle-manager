"""Genera los diagramas de componentes (UML 2.5, conectores de ensamble sin flechas) en SVG."""
import math, sys

ROSA = '#A3195B'; FONDO = '#FCF1F6'; LINEA = '#333333'; GRIS = '#555555'
FONT = "DejaVu Sans, Arial, sans-serif"

class Lienzo:
    def __init__(s, w, h):
        s.w, s.h, s.p = w, h, []
    def add(s, x): s.p.append(x)
    def texto(s, x, y, t, size=15, peso='normal', color='#222', anchor='middle', italic=False):
        st = 'italic' if italic else 'normal'
        t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        s.add(f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{peso}" font-style="{st}" fill="{color}" text-anchor="{anchor}">{t}</text>')
    def linea(s, pts, dash=False):
        d = ' '.join(f'{x},{y}' for x, y in pts)
        da = ' stroke-dasharray="8 6"' if dash else ''
        s.add(f'<polyline points="{d}" fill="none" stroke="{LINEA}" stroke-width="2"{da}/>')
    def marco(s, x, y, w, h, titulo):
        s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{GRIS}" stroke-width="2"/>')
        tw = len(titulo) * 9.6 + 24
        s.add(f'<path d="M{x},{y} h{tw} v28 h-{tw} z" fill="#F4F4F4" stroke="{GRIS}" stroke-width="2"/>')
        s.texto(x + 12, y + 20, titulo, 16, 'bold', '#333', 'start')
    def comp(s, cx, cy, w, h, nombre, sub='', estereo=''):
        x, y = cx - w / 2, cy - h / 2
        s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{FONDO}" stroke="{ROSA}" stroke-width="2"/>')
        ix, iy = x + w - 42, y + 12
        s.add(f'<rect x="{ix+8}" y="{iy}" width="26" height="22" fill="none" stroke="{ROSA}" stroke-width="1.6"/>')
        s.add(f'<rect x="{ix}" y="{iy+4}" width="14" height="5" fill="{FONDO}" stroke="{ROSA}" stroke-width="1.6"/>')
        s.add(f'<rect x="{ix}" y="{iy+13}" width="14" height="5" fill="{FONDO}" stroke="{ROSA}" stroke-width="1.6"/>')
        lineas = ([('«' + estereo + '»', 13, 'normal', True)] if estereo else []) + [(nombre, 17 if w >= 230 else 14.5, 'bold', False)] + \
                 [(t, 13.5, 'normal', False) for t in sub.split('\n') if t]
        alto = sum(sz + 6 for _, sz, _, _ in lineas)
        yy = cy - alto / 2 + lineas[0][1] + (0 if w >= 230 else 9)
        for t, sz, pe, it in lineas:
            s.texto(cx, yy, t, sz, pe, '#222' if pe == 'bold' else '#333', 'middle', it)
            yy += sz + 6
    def interfaz(s, x, y, hacia, nombre, lx=None, ly=None, anchor='start', extra=''):
        """Bola (provista) en (x,y); media luna (requerida) abierta hacia el proveedor.
        hacia = lado donde está el componente que REQUIERE: 'arriba','abajo','izq','der'."""
        r, R = 11, 22
        th = {'arriba': 90, 'abajo': 270, 'izq': 180, 'der': 0}[hacia]
        a0, a1 = math.radians(th + 90), math.radians(th - 90)
        # media luna: semicirculo del lado del requeridor
        x0, y0 = x + R * math.cos(a0), y - R * math.sin(a0)
        x1, y1 = x + R * math.cos(a1), y - R * math.sin(a1)
        s.add(f'<path d="M{x0:.1f},{y0:.1f} A{R},{R} 0 0 1 {x1:.1f},{y1:.1f}" fill="none" stroke="{LINEA}" stroke-width="2"/>')
        s.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="white" stroke="{ROSA}" stroke-width="2"/>')
        if lx is None: lx, ly = x + 34, y + 6
        s.texto(lx, ly, nombre, 15.5, 'bold', ROSA, anchor)
        if extra:
            for i, t in enumerate(extra.split('\n')):
                s.texto(lx, ly + 20 * (i + 1), t, 13.5, 'normal', '#444', anchor)
    def nota(s, x, y, w, lineas, titulo=None):
        h = 24 + 30 * len(lineas) + (34 if titulo else 0)
        s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#F6F6F6" stroke="#999" stroke-width="1.5"/>')
        yy = y + 34
        if titulo:
            s.texto(x + 20, yy, titulo, 17, 'bold', '#333', 'start'); yy += 36
        for t in lineas:
            s.texto(x + 20, yy, t, 15.5, 'normal', '#333', 'start'); yy += 30
    def svg(s):
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.w}" height="{s.h}" viewBox="0 0 {s.w} {s.h}"><rect width="100%" height="100%" fill="white"/>' + ''.join(s.p) + '</svg>'


def general():
    L = Lienzo(2000, 1080)
    L.texto(1000, 56, 'Diagrama de Componentes (vista general) — BellaStyle Manager', 30, 'bold')
    L.texto(1000, 90, 'Los componentes se conectan solo por interfaces: bola = provista, media luna = requerida', 16, 'normal', '#555')
    cy = 260
    L.comp(310, cy, 430, 170, 'Frontend', 'HTML + JavaScript + Tailwind\n(navegador)')
    L.comp(1000, cy, 430, 170, 'Backend', 'Node.js + Express\n(servidor en Render)')
    L.comp(1690, cy, 430, 170, 'Base de datos', 'MySQL 8.4\n(Aiven)', 'database')
    L.linea([(525, cy), (785, cy)]); L.interfaz(655, cy, 'izq', 'IApiRest', 655, cy - 44, 'middle', '')
    L.texto(655, cy + 56, 'HTTPS + JSON', 14, 'normal', '#444'); L.texto(655, cy + 76, '(local: puerto 3000)', 13, 'normal', '#444')
    L.linea([(1215, cy), (1475, cy)]); L.interfaz(1345, cy, 'izq', 'ISQL', 1345, cy - 44, 'middle')
    L.texto(1345, cy + 56, 'TCP + SSL', 14, 'normal', '#444'); L.texto(1345, cy + 76, '(local: puerto 3306)', 13, 'normal', '#444')
    gy = 590
    L.comp(1000, gy, 430, 150, 'Servicio de IA', 'Gemini API (Google)\nmodelo Gemini Flash-Lite', 'external')
    L.linea([(1000, cy + 85), (1000, gy - 75)]); L.interfaz(1000, 430, 'arriba', 'IGemini', 1036, 436, 'start', 'HTTPS + JSON')
    L.nota(70, 740, 1860, [
        'El Frontend REQUIERE (media luna) la interfaz IApiRest que el Backend PROVEE (bola).',
        'El Backend REQUIERE la interfaz ISQL que provee la Base de datos y la interfaz IGemini que provee el servicio de IA de Google.',
        'Cada conexión es un conector de ensamble: bola dentro de media luna, sin flechas.',
        'El Backend se detalla por dentro en el diagrama de componentes detallado.'])
    return L


def detallado():
    L = Lienzo(2400, 1760)
    L.texto(1200, 48, 'Diagrama de Componentes (vista detallada) — BellaStyle Manager', 30, 'bold')
    L.texto(1200, 80, 'Los componentes se conectan solo por interfaces: bola = provista, media luna = requerida', 16, 'normal', '#555')
    # Frontend
    L.marco(420, 110, 1240, 210, 'Frontend (navegador)')
    L.comp(640, 215, 420, 110, 'Interfaz de Usuario', 'páginas HTML + js (panel, chat, servicios)')
    L.comp(1235, 215, 330, 110, 'Cliente API', 'api.js')
    L.linea([(850, 215), (1070, 215)]); L.interfaz(960, 215, 'izq', 'IClienteAPI', 960, 172, 'middle')
    # Backend
    L.marco(300, 410, 1620, 930, 'Backend (Node.js + Express)')
    L.comp(1235, 520, 330, 100, 'Enrutador', 'routes/rutas.js (68 rutas)')
    L.linea([(1235, 270), (1235, 470)]); L.interfaz(1235, 365, 'arriba', 'IApiRest', 1270, 372, 'start', 'HTTPS + JSON')
    # Seguridad: el enrutador pide la sesión (token JWT) y el rol antes de llamar al controlador
    L.comp(1680, 520, 250, 100, 'Seguridad', 'middleware/seguridad.js\nsesión JWT y roles')
    L.linea([(1400, 520), (1555, 520)]); L.interfaz(1478, 520, 'izq', 'ISeguridad', 1478, 480, 'middle')
    L.comp(2170, 520, 250, 100, 'jsonwebtoken', 'firma y valida tokens', 'library')
    L.linea([(1805, 520), (2045, 520)]); L.interfaz(1955, 520, 'izq', 'IJwt', 1955, 480, 'middle')
    xs = [440, 665, 890, 1115, 1340, 1565, 1790]
    nombres = [('Autenticación', 'authController', 'IAutenticacion'),
               ('Catálogo y gestión', 'catalogo · gestion', 'ICatalogo'),
               ('Citas y agenda', 'citas · horario\ncalificacion', 'ICitas'),
               ('Perfil y fotos', 'perfil · fotoServicio', 'IPerfil'),
               ('Pagos y PDF', 'pago (Bre-B, QR)\ncomprobante', 'IPagos'),
               ('Tienda y pedidos', 'pedidoController', 'IPedidos'),
               ('Chats', 'chat · chatCita', 'IChat')]
    L.linea([(xs[0], 610), (xs[-1], 610)]); L.linea([(1235, 570), (1235, 610)])
    for x, (n, sub, i) in zip(xs, nombres):
        L.linea([(x, 610), (x, 700)])
        L.interfaz(x, 655, 'arriba', i, x + 26, 661, 'start')
        L.comp(x, 750, 212, 100, n, sub)
    # utilidades
    uy = 945
    L.comp(575, uy+10, 200, 90, 'Validadores', 'validators.js')
    L.linea([(500, 800), (500, 850), (630, 850), (630, 800)]); L.linea([(575, 850), (575, 910)])
    L.interfaz(575, 878, 'arriba', 'IValidacion', 545, 884, 'end')
    L.comp(890, uy, 186, 90, 'Agenda', 'utils/agenda.js')
    L.linea([(890, 800), (890, 900)]); L.interfaz(890, 860, 'arriba', 'IAgenda', 920, 866, 'start')
    L.comp(1115, uy, 186, 90, 'Imágenes', 'utils/imagenes.js')
    L.linea([(1115, 800), (1115, 900)]); L.interfaz(1115, 860, 'arriba', 'IImagenes', 1145, 866, 'start')
    L.comp(1340, uy, 186, 90, 'pdfkit', 'genera PDF', 'library')
    L.linea([(1340, 800), (1340, 900)]); L.interfaz(1340, 860, 'arriba', 'IPdf', 1370, 866, 'start')
    L.comp(1790, uy, 186, 100, 'Asistente IA', 'asistenteIA.js\n+ asistente.js', '')
    L.linea([(1790, 800), (1790, 895)]); L.interfaz(1790, 855, 'arriba', 'IAsistente', 1820, 861, 'start')
    # bcryptjs (izquierda, fuera del marco)
    L.comp(150, 750, 200, 100, 'bcryptjs', 'hash de contraseñas', 'library')
    L.linea([(250, 750), (327, 750)]); L.interfaz(285, 750, 'der', 'ICifrado', 285, 798, 'middle')
    # Gemini (derecha, fuera del marco)
    L.comp(2170, uy, 250, 110, 'Gemini API', 'Google · Flash-Lite', 'external')
    L.linea([(1883, uy), (2045, uy)]); L.interfaz(1965, uy, 'izq', 'IGemini', 1965, uy - 40, 'middle', '')
    L.texto(1965, uy + 48, 'HTTPS + JSON', 13.5, 'normal', '#444')
    # acceso a datos
    by = 1100
    drops = [xs[0] - 96] + [x + 98 for x in xs[1:-2]] + [xs[-2], xs[-1] - 98]   # Tienda baja por el centro
    for d in drops: L.linea([(d, 800), (d, by)])
    L.linea([(drops[0], by), (drops[-1], by)])
    L.comp(965, 1240, 260, 90, 'Modelos', 'models/ (SQL de cada tabla)')
    L.linea([(965, by), (965, 1195)]); L.interfaz(965, 1150, 'arriba', 'IAccesoDatos', 995, 1156, 'start')
    L.comp(1400, 1240, 260, 90, 'Conexión', 'config/db.js (pool)')
    L.linea([(1095, 1240), (1270, 1240)]); L.interfaz(1182, 1240, 'izq', 'IConexion', 1182, 1200, 'middle')
    # mysql2 y MySQL (fuera del marco)
    L.comp(1400, 1460, 260, 100, 'mysql2', 'driver de MySQL', 'library')
    L.linea([(1400, 1285), (1400, 1410)]); L.interfaz(1400, 1375, 'arriba', 'IDriverMySQL', 1430, 1381, 'start')
    L.comp(1960, 1460, 300, 110, 'MySQL Server 8.4', 'bellastylemanager (Aiven)', 'database')
    L.linea([(1530, 1460), (1810, 1460)]); L.interfaz(1670, 1460, 'izq', 'ISQL', 1670, 1420, 'middle')
    L.texto(1670, 1508, 'TCP + SSL', 13.5, 'normal', '#444')
    L.nota(300, 1390, 900, ['Bola: interfaz provista (el componente ofrece el servicio)',
                           'Media luna: interfaz requerida (el componente necesita el servicio)',
                           'Bola dentro de la media luna = conector de ensamble',
                           'No se usan flechas: toda dependencia se expresa por una interfaz',
                           'Chats también usa IValidacion (teléfono y correo del visitante)'], 'Notación UML 2.5')
    return L

if __name__ == '__main__':
    open('comp_general.svg', 'w').write(general().svg())
    open('comp_detallado.svg', 'w').write(detallado().svg())


def nodo(L, x, y, w, h, estereo, nombre, sub=None, fondo='#F9F9F9'):
    d = 16
    L.add(f'<path d="M{x},{y} l{d},-{d} h{w} v{h} l-{d},{d}" fill="#EDEDED" stroke="{GRIS}" stroke-width="1.6"/>')
    L.add(f'<path d="M{x+w},{y} l{d},-{d}" fill="none" stroke="{GRIS}" stroke-width="1.6"/>')
    L.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fondo}" stroke="{GRIS}" stroke-width="1.6"/>')
    L.texto(x + w / 2, y + 26, '«' + estereo + '»', 14, 'normal', '#333', 'middle', True)
    L.texto(x + w / 2, y + 48, nombre, 17, 'bold', '#222')
    if sub: L.texto(x + w / 2, y + 70, sub, 14, 'normal', '#444')

def artefacto(L, x, y, w, h, lineas, estereo='artifact'):
    L.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{FONDO}" stroke="{ROSA}" stroke-width="1.6"/>')
    ix, iy = x + w - 30, y + 10
    L.add(f'<path d="M{ix},{iy} h12 l6,6 v16 h-18 z M{ix+12},{iy} v6 h6" fill="white" stroke="{ROSA}" stroke-width="1.3"/>')
    L.texto(x + w / 2, y + 24, '«' + estereo + '»', 13, 'normal', '#333', 'middle', True)
    for i, t in enumerate(lineas):
        L.texto(x + w / 2, y + 46 + i * 20, t, 14.5, 'normal', '#222')

def cilindro(L, x, y, w, h, lineas):
    e = 14
    L.add(f'<path d="M{x},{y+e} a{w/2},{e} 0 0 1 {w},0 v{h-2*e} a{w/2},{e} 0 0 1 -{w},0 z" fill="#EAF6EC" stroke="#2E8B57" stroke-width="1.6"/>')
    L.add(f'<path d="M{x},{y+e} a{w/2},{e} 0 0 0 {w},0" fill="none" stroke="#2E8B57" stroke-width="1.6"/>')
    L.texto(x + w / 2, y + 2 * e + 20, '«schema»', 13, 'normal', '#333', 'middle', True)
    for i, t in enumerate(lineas):
        L.texto(x + w / 2, y + 2 * e + 42 + i * 20, t, 14.5, 'normal', '#222')

def despliegue():
    L = Lienzo(2200, 1180)
    L.texto(1100, 50, 'Diagrama de Despliegue (UML 2.5) — BellaStyle Manager en producción', 30, 'bold')
    L.texto(1100, 82, 'Nodos físicos o en la nube («device»), entornos de ejecución («executionEnvironment») y artefactos desplegados', 16, 'normal', '#555')
    # Usuario
    nodo(L, 60, 210, 500, 400, 'device', 'PC o celular del usuario')
    nodo(L, 100, 310, 420, 270, 'executionEnvironment', 'Navegador web', fondo='#FFFFFF')
    artefacto(L, 140, 410, 340, 120, ['index.html · panel.html', 'estilos.css · js/*.js'])
    # Render
    nodo(L, 760, 160, 680, 600, 'device', 'Servidor Render', 'servicio web «bellastyle»')
    nodo(L, 800, 270, 600, 460, 'executionEnvironment', 'Node.js 20', fondo='#FFFFFF')
    nodo(L, 840, 370, 520, 330, 'executionEnvironment', 'Express 4', fondo='#F9F9F9')
    artefacto(L, 880, 460, 440, 100, ['app.js · routes/ · controllers/', 'models/ · utils/ · config/'])
    artefacto(L, 880, 580, 440, 100, ['frontend/ (HTML, CSS, JS, img)', 'archivos estáticos'])
    # Aiven
    nodo(L, 1640, 210, 500, 400, 'device', 'Servidor Aiven', 'servicio «bellastyle-mysql»')
    nodo(L, 1680, 320, 420, 260, 'executionEnvironment', 'MySQL Server 8.4', fondo='#FFFFFF')
    cilindro(L, 1770, 410, 240, 140, ['bellastylemanager', '(22 tablas)'])
    # Google
    nodo(L, 1640, 830, 500, 300, 'device', 'Google Cloud')
    nodo(L, 1680, 900, 420, 200, 'executionEnvironment', 'Gemini API', fondo='#FFFFFF')
    artefacto(L, 1720, 980, 340, 100, ['gemini-flash-lite-latest', 'API v1beta'])
    # Rutas de comunicación
    L.linea([(560, 420), (760, 420)])
    L.texto(660, 404, '«HTTPS»', 15, 'bold', ROSA); L.texto(660, 446, 'puerto 443', 14, 'normal', '#444')
    L.texto(575, 404, '0..*', 14, 'normal', '#222', 'start'); L.texto(745, 404, '1', 14, 'normal', '#222', 'end')
    L.linea([(1440, 420), (1640, 420)])
    L.texto(1540, 404, '«TCP/IP + SSL»', 15, 'bold', ROSA); L.texto(1540, 446, 'protocolo MySQL', 14, 'normal', '#444')
    L.texto(1455, 404, '1', 14, 'normal', '#222', 'start'); L.texto(1625, 404, '1', 14, 'normal', '#222', 'end')
    L.linea([(1100, 760), (1100, 980), (1640, 980)])
    L.texto(1370, 964, '«HTTPS»', 15, 'bold', ROSA); L.texto(1370, 1006, 'JSON + API key', 14, 'normal', '#444')
    L.nota(60, 820, 940, ['Las claves llegan como variables de entorno: DB_HOST, DB_PORT, DB_USER,',
                         'DB_PASSWORD, DB_NAME, DB_SSL, GEMINI_API_KEY, CODIGO_ADMIN y JWT_SECRETO.',
                         'El código llega desde GitHub (rama main): Render ejecuta npm install y node app.js.',
                         'En el computador de desarrollo: http://localhost:3000 y MySQL en el puerto 3306.'], 'Notas')
    return L

if __name__ == '__main__':
    open('despliegue.svg', 'w').write(despliegue().svg())
