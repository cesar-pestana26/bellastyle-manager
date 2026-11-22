# Fuentes de los manuales (APA 7)

Scripts de Python que generan el Manual Técnico y el Manual de Usuario en Word y PDF.
Requieren `python-docx`, `Pillow`, LibreOffice (`soffice`) y `pdftotext` (poppler).

- `portada.py`: autores, profesor, curso y fecha de la portada. Cambiarlos aquí.
- `refs.py`: referencias APA.
- `apa.py`: formato APA (Times New Roman 12, doble espacio, tablas y figuras numeradas, índice con páginas).

```
python manual_tecnico.py ../diagramas salida/Manual_Tecnico.docx
python manual_usuario.py <carpeta de capturas .jpg> salida/Manual_de_Usuario.docx
```
