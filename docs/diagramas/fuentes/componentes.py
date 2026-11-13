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
        lineas = ([('«' + estereo + '»', 13, 'normal', True)] if estereo else []) + [(nombre, 17, 'bold', False)] + \
                 [(t, 13.5, 'normal', False) for t in sub.split('\n') if t]
        alto = sum(sz + 6 for _, sz, _, _ in lineas)
        yy = cy - alto / 2 + lineas[0][1]
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
    L.comp(1000, gy, 430, 150, 'Servicio de IA', 'Gemini API (Google)\nmodelo Gemma 4', 'external')
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
    L.comp(1235, 520, 330, 100, 'Enrutador', 'routes/rutas.js (58 rutas)')
    L.linea([(1235, 270), (1235, 470)]); L.interfaz(1235, 365, 'arriba', 'IApiRest', 1270, 372, 'start', 'HTTPS + JSON')
    xs = [445, 705, 965, 1235, 1495, 1755]
    nombres = [('Autenticación', 'authController', 'IAutenticacion'),
               ('Catálogo y gestión', 'catalogo · gestion', 'ICatalogo'),
               ('Citas y agenda', 'citas · horario\ncalificacion', 'ICitas'),
               ('Perfil y fotos', 'perfil · fotoServicio', 'IPerfil'),
               ('Comprobantes', 'comprobanteController', 'IComprobante'),
               ('Chats', 'chat · chatCita', 'IChat')]
    L.linea([(xs[0], 610), (xs[-1], 610)]); L.linea([(1235, 570), (1235, 610)])
    for x, (n, sub, i) in zip(xs, nombres):
        L.linea([(x, 610), (x, 700)])
        L.interfaz(x, 655, 'arriba', i, x + 30, 661, 'start')
        L.comp(x, 750, 235, 100, n, sub)
    # utilidades
    uy = 945
    L.comp(575, uy+10, 210, 90, 'Validadores', 'validators.js')
    L.linea([(500, 800), (500, 850), (650, 850), (650, 800)]); L.linea([(575, 850), (575, 910)])
    L.interfaz(575, 878, 'arriba', 'IValidacion', 545, 884, 'end')
    L.comp(965, uy, 210, 90, 'Agenda', 'utils/agenda.js')
    L.linea([(965, 800), (965, 900)]); L.interfaz(965, 860, 'arriba', 'IAgenda', 995, 866, 'start')
    L.comp(1235, uy, 210, 90, 'Imágenes', 'utils/imagenes.js')
    L.linea([(1235, 800), (1235, 900)]); L.interfaz(1235, 860, 'arriba', 'IImagenes', 1265, 866, 'start')
    L.comp(1495, uy, 210, 90, 'pdfkit', 'genera PDF', 'library')
    L.linea([(1495, 800), (1495, 900)]); L.interfaz(1495, 860, 'arriba', 'IPdf', 1525, 866, 'start')
    L.comp(1755, uy, 210, 100, 'Asistente IA', 'asistenteIA.js\n+ asistente.js', '')
    L.linea([(1755, 800), (1755, 895)]); L.interfaz(1755, 855, 'arriba', 'IAsistente', 1785, 861, 'start')
    # bcryptjs (izquierda, fuera del marco)
    L.comp(150, 750, 200, 100, 'bcryptjs', 'hash de contraseñas', 'library')
    L.linea([(250, 750), (327, 750)]); L.interfaz(285, 750, 'der', 'ICifrado', 285, 798, 'middle')
    # Gemini (derecha, fuera del marco)
    L.comp(2170, uy, 250, 110, 'Gemini API', 'Google · Gemma 4', 'external')
    L.linea([(1860, uy), (2045, uy)]); L.interfaz(1955, uy, 'izq', 'IGemini', 1955, uy - 40, 'middle', '')
    L.texto(1955, uy + 48, 'HTTPS + JSON', 13.5, 'normal', '#444')
    # acceso a datos
    by = 1100
    drops = [(xs[0] - 95), (xs[1] + 112), (xs[2] + 112), (xs[3] + 112), (xs[4] + 112), (xs[5] - 112)]
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
