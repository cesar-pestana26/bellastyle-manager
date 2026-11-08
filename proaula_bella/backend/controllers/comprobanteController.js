// Comprobante en PDF de un servicio prestado (cita finalizada).
// Lo descarga la administradora (o la clienta) como evidencia del servicio.
// Se arma con la librería pdfkit: el PDF se dibuja con texto, líneas y rectángulos.
const path = require('path');
const PDFDocument = require('pdfkit');
const citaModel = require('../models/citaModel');

const ROSA = '#a85477';
const TINTA = '#2b1d31';
const GRIS = '#6b5a70';
const LOGO = path.join(__dirname, '../../frontend/img/logo-pdf.png');

function pesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

// "2026-05-25" -> "25/05/2026"
function fechaLarga(fecha) {
    const [a, m, d] = fecha.split('-');
    return `${d}/${m}/${a}`;
}

// GET /api/citas/:id/comprobante
async function comprobante(req, res) {
    try {
        const cita = await citaModel.detalle(req.params.id);
        if (!cita) return res.status(404).json({ success: false, message: 'La cita no existe.' });
        if (cita.estado !== 'Finalizada') {
            return res.status(400).json({ success: false, message: 'El comprobante solo se genera para servicios finalizados.' });
        }

        const codigo = `BS-${cita.id}`;
        const doc = new PDFDocument({ size: 'A5', margin: 40, info: { Title: `Comprobante ${codigo}`, Author: 'BellaStyle' } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="comprobante-${codigo}.pdf"`);
        doc.pipe(res);

        const ancho = doc.page.width - 80;

        // Encabezado: franja rosa con logo y nombre del salón
        doc.rect(0, 0, doc.page.width, 90).fill('#f7d3e2');
        try { doc.image(LOGO, 40, 20, { width: 50 }); } catch (e) { /* sin logo */ }
        doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(20).text('BellaStyle', 100, 26);
        doc.font('Helvetica').fontSize(9).fillColor(GRIS).text('Salón de belleza · Cartagena', 100, 50);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ROSA).text(`COMPROBANTE ${codigo}`, 40, 34, { width: ancho, align: 'right' });

        // Título
        doc.moveDown(0);
        doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(15).text('Constancia de servicio prestado', 40, 115);
        doc.font('Helvetica').fontSize(9).fillColor(GRIS)
            .text(`Generado el ${new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}`);

        // Filas de datos: etiqueta a la izquierda y valor a la derecha
        let y = 160;
        function fila(etiqueta, valor) {
            doc.font('Helvetica').fontSize(9).fillColor(GRIS).text(etiqueta, 40, y, { width: 120 });
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA).text(valor || '—', 160, y, { width: ancho - 120 });
            y = Math.max(doc.y, y + 14) + 6;
            doc.moveTo(40, y - 3).lineTo(40 + ancho, y - 3).lineWidth(0.5).strokeColor('#f1e4ea').stroke();
        }
        fila('Clienta', cita.cliente);
        if (cita.telefono) fila('Teléfono', cita.telefono);
        if (cita.email) fila('Correo', cita.email);
        fila('Servicio', cita.servicio);
        fila('Duración', `${cita.duracion_min} minutos`);
        fila('Fecha y hora', `${fechaLarga(cita.fecha)} · ${cita.hora}`);
        fila('Atendida por', cita.estilista);
        if (cita.notas_servicio) fila('Detalle del servicio', cita.notas_servicio);
        if (cita.calificacion) fila('Calificación', `${cita.calificacion} de 5 estrellas`);

        // Total
        y += 8;
        doc.roundedRect(40, y, ancho, 40, 8).fill('#fdf5f8');
        doc.font('Helvetica').fontSize(10).fillColor(GRIS).text('Valor del servicio', 55, y + 14);
        doc.font('Helvetica-Bold').fontSize(16).fillColor(ROSA).text(pesos(cita.precio), 40, y + 11, { width: ancho - 15, align: 'right' });

        // Pie
        doc.font('Helvetica').fontSize(8).fillColor(GRIS).text(
            'Este documento certifica que el servicio fue realizado en BellaStyle. Gracias por tu visita.',
            40, doc.page.height - 70, { width: ancho, align: 'center' });
        doc.end();
    } catch (err) {
        console.error('Error al generar el comprobante:', err.message);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'No se pudo generar el comprobante.' });
    }
}

module.exports = { comprobante };
