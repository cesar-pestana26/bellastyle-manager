# apa.py - Arma documentos Word con normas APA 7 (versión estudiante) usando python-docx.
# Times New Roman 12, doble espacio, márgenes de 2,54 cm, número de página arriba a la derecha,
# títulos por niveles, tablas y figuras numeradas con título en cursiva, y lista de referencias
# con sangría francesa. La tabla de contenido se llena con los números de página reales
# (se calcula convirtiendo a PDF y buscando cada título).
import re, subprocess, os, copy
import docx
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

FUENTE = 'Times New Roman'


def _campo(run, instr):
    for tipo, texto in (('begin', None), (None, instr), ('separate', None), (None, '1'), ('end', None)):
        if tipo:
            e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), tipo); run._r.append(e)
        elif texto == instr:
            e = OxmlElement('w:instrText'); e.set(qn('xml:space'), 'preserve'); e.text = instr; run._r.append(e)
        else:
            e = OxmlElement('w:t'); e.text = texto; run._r.append(e)


def _bordes_celda(celda, **lados):
    tcPr = celda._tc.get_or_add_tcPr()
    b = tcPr.find(qn('w:tcBorders'))
    if b is None:
        b = OxmlElement('w:tcBorders'); tcPr.append(b)
    for lado, val in lados.items():
        e = OxmlElement('w:' + lado)
        if val:
            e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), str(val)); e.set(qn('w:color'), '000000')
        else:
            e.set(qn('w:val'), 'nil')
        b.append(e)


class DocAPA:
    def __init__(self, titulo_corto=''):
        self.d = docx.Document()
        self.tabla_n = 0
        self.figura_n = 0
        self.titulos = []          # (nivel, texto) para la tabla de contenido
        s = self.d.sections[0]
        s.page_width, s.page_height = Inches(8.5), Inches(11)
        for m in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'):
            setattr(s, m, Inches(1))
        st = self.d.styles['Normal']
        st.font.name = FUENTE; st.font.size = Pt(12)
        st.element.rPr.rFonts.set(qn('w:eastAsia'), FUENTE)
        pf = st.paragraph_format
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        pf.space_before = Pt(0); pf.space_after = Pt(0)
        # títulos APA (también sirven para el panel de navegación de Word)
        for nivel in (1, 2, 3):
            h = self.d.styles['Heading %d' % nivel]
            h.font.name = FUENTE; h.font.size = Pt(12); h.font.bold = True
            h.font.italic = (nivel == 3); h.font.color.rgb = RGBColor(0, 0, 0)
            rpr = h.element.get_or_add_rPr(); rf = rpr.find(qn('w:rFonts'))
            if rf is None:
                rf = OxmlElement('w:rFonts'); rpr.append(rf)
            for a in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'):
                rf.set(qn(a), FUENTE)
            for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
                if rf.get(qn(a)) is not None:
                    del rf.attrib[qn(a)]
            hp = h.paragraph_format
            hp.space_before = Pt(0); hp.space_after = Pt(0)
            hp.line_spacing_rule = WD_LINE_SPACING.DOUBLE
            hp.alignment = WD_ALIGN_PARAGRAPH.CENTER if nivel == 1 else WD_ALIGN_PARAGRAPH.LEFT
            hp.keep_with_next = True
        # número de página arriba a la derecha
        enc = s.header.paragraphs[0]
        enc.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r = enc.add_run(); r.font.name = FUENTE; r.font.size = Pt(12)
        _campo(r, 'PAGE')

    # ---------- texto ----------
    def _runs(self, p, texto):
        # **negrita** y _cursiva_ dentro del texto
        for parte in re.split(r'(\*\*[^*]+\*\*|~[^~]+~)', texto):
            if not parte:
                continue
            if parte.startswith('**'):
                p.add_run(parte[2:-2]).bold = True
            elif parte.startswith('~') and parte.endswith('~') and len(parte) > 2:
                p.add_run(parte[1:-1]).italic = True
            else:
                p.add_run(parte)
        return p

    def parrafo(self, texto, sangria=True, alinear=None):
        p = self.d.add_paragraph()
        if sangria:
            p.paragraph_format.first_line_indent = Inches(0.5)
        if alinear == 'centro':
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return self._runs(p, texto)

    def titulo(self, texto, nivel=1, en_indice=True):
        p = self.d.add_paragraph(style='Heading %d' % nivel)
        self._runs(p, texto)
        if en_indice:
            self.titulos.append((nivel, re.sub(r'\*\*|~', '', texto)))
        return p

    def lista(self, items, numerada=False):
        for i, t in enumerate(items, 1):
            p = self.d.add_paragraph()
            pf = p.paragraph_format
            pf.left_indent = Inches(0.75); pf.first_line_indent = Inches(-0.25)
            self._runs(p, ('%d.\t' % i if numerada else '•\t') + t)
            pf.tab_stops.add_tab_stop(Inches(0.75))

    def salto(self):
        self.d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ---------- portada (APA estudiante) ----------
    def portada(self, titulo, subtitulo, autores, institucion, curso, profesor, fecha):
        for _ in range(3):
            self.d.add_paragraph()
        p = self.parrafo('**%s**' % titulo, sangria=False, alinear='centro')
        if subtitulo:
            self.parrafo('**%s**' % subtitulo, sangria=False, alinear='centro')
        self.d.add_paragraph()
        for linea in [autores, institucion, curso, profesor, fecha]:
            self.parrafo(linea, sangria=False, alinear='centro')
        self.salto()

    # ---------- tabla de contenido ----------
    def indice(self):
        self.titulo('Tabla de contenido', 1, en_indice=False)
        self._marca_indice = len(self.d.paragraphs)
        self.salto()

    def _llenar_indice(self, paginas):
        # inserta las líneas del índice antes del salto de página que sigue al título
        cuerpo = self.d.element.body
        ancla = self.d.paragraphs[self._marca_indice]._p     # el párrafo con el salto de página
        for i, (nivel, texto) in enumerate(self.titulos):
            p = self.d.add_paragraph()
            pf = p.paragraph_format
            pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
            pf.left_indent = Inches(0.35 * (nivel - 1))
            pf.tab_stops.add_tab_stop(Inches(6.5), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
            r = p.add_run(texto)
            if nivel == 1:
                r.bold = True
            p.add_run('\t' + str(paginas[i] if i < len(paginas) else ''))
            ancla.addprevious(p._p)

    # ---------- tablas APA ----------
    def tabla(self, titulo, encabezados, filas, anchos=None, nota=None, tam=10):
        self.tabla_n += 1
        p = self.parrafo('**Tabla %d**' % self.tabla_n, sangria=False)
        p.paragraph_format.keep_with_next = True
        p = self.parrafo('~%s~' % titulo, sangria=False)
        p.paragraph_format.keep_with_next = True
        t = self.d.add_table(rows=1, cols=len(encabezados))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        def llenar(celda, texto, negrita=False):
            celda.text = ''
            pp = celda.paragraphs[0]
            pp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            pp.paragraph_format.space_before = Pt(2); pp.paragraph_format.space_after = Pt(2)
            for i, linea in enumerate(str(texto).split('\n')):
                if i:
                    pp = celda.add_paragraph()
                    pp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
                self._runs(pp, ('**%s**' % linea) if negrita and linea else linea)
                for r in pp.runs:
                    r.font.size = Pt(tam)
        for c, h in zip(t.rows[0].cells, encabezados):
            llenar(c, h, True)
            _bordes_celda(c, top=8, bottom=8)
        for fila in filas:
            cells = t.add_row().cells
            for c, v in zip(cells, fila):
                llenar(c, v)
        for c in t.rows[-1].cells:
            _bordes_celda(c, bottom=8)
        if anchos:
            t.autofit = False
            tblPr = t._tbl.tblPr
            tw = tblPr.find(qn('w:tblW'))
            if tw is None:
                tw = OxmlElement('w:tblW'); tblPr.append(tw)
            tw.set(qn('w:w'), str(int(sum(anchos) * 1440))); tw.set(qn('w:type'), 'dxa')
            grid = t._tbl.tblGrid
            for gc, w in zip(grid.findall(qn('w:gridCol')), anchos):
                gc.set(qn('w:w'), str(int(w * 1440)))
            for row in t.rows:
                for c, w in zip(row.cells, anchos):
                    c.width = Inches(w)
        # no partir el encabezado de la tabla entre páginas
        trPr = t.rows[0]._tr.get_or_add_trPr(); e = OxmlElement('w:tblHeader'); e.set(qn('w:val'), 'true'); trPr.append(e)
        if nota:
            self.parrafo('~Nota.~ ' + nota, sangria=False)
        else:
            self.d.add_paragraph()
        return t

    # ---------- figuras APA ----------
    def figura(self, ruta, titulo, nota=None, ancho=6.0, alto_max=7.2):
        self.figura_n += 1
        p = self.parrafo('**Figura %d**' % self.figura_n, sangria=False)
        p.paragraph_format.keep_with_next = True
        p = self.parrafo('~%s~' % titulo, sangria=False)
        p.paragraph_format.keep_with_next = True
        w, h = Image.open(ruta).size
        ancho = min(ancho, alto_max * w / h)
        p = self.d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        p.paragraph_format.keep_with_next = bool(nota)
        p.add_run().add_picture(ruta, width=Inches(ancho))
        if nota:
            self.parrafo('~Nota.~ ' + nota, sangria=False)
        return self.figura_n

    # ---------- referencias ----------
    def referencias(self, refs):
        self.salto()
        self.titulo('Referencias', 1)
        for r in sorted(refs, key=lambda x: re.sub(r'[*~]', '', x).lower()):
            p = self.parrafo(r, sangria=False)
            p.paragraph_format.left_indent = Inches(0.5)
            p.paragraph_format.first_line_indent = Inches(-0.5)

    # ---------- guardar con índice ----------
    def guardar(self, ruta_docx):
        carpeta = os.path.dirname(os.path.abspath(ruta_docx))
        tmp = ruta_docx.replace('.docx', '_tmp.docx')
        # 1.ª pasada: índice con números provisionales para que ocupe su espacio real
        estado = copy.deepcopy(self.d.element.body)
        self._llenar_indice(['00'] * len(self.titulos))
        self.d.save(tmp)
        paginas = _paginas_de_titulos(tmp, [t for _, t in self.titulos], carpeta)
        os.remove(tmp)
        # 2.ª pasada: con los números reales
        cuerpo = self.d.element.body
        for hijo in list(cuerpo):
            cuerpo.remove(hijo)
        for hijo in estado:
            cuerpo.append(hijo)
        self._llenar_indice(paginas)
        self.d.save(ruta_docx)
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', carpeta, ruta_docx],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return paginas


def _normal(t):
    return re.sub(r'\s+', ' ', t).strip().lower()


def _paginas_de_titulos(ruta_docx, titulos, carpeta):
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', carpeta, ruta_docx],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    pdf = ruta_docx.replace('.docx', '.pdf')
    texto = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    os.remove(pdf)
    paginas = [_normal(pg) for pg in texto.split('\f')]
    res, desde = [], 2       # se busca después de la portada y del propio índice
    for t in titulos:
        clave = _normal(t)[:60]
        for i in range(desde, len(paginas)):
            # el título debe aparecer en su propia línea de la página
            lineas = [_normal(l) for l in texto.split('\f')[i].split('\n') if '..' not in l]
            if any(l.startswith(clave[:40]) for l in lineas):
                res.append(i + 1); desde = i
                break
        else:
            res.append('')
    return res
