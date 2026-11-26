const APERTURA = 8 * 60;
const CIERRE = 19 * 60;
const CIERRE_DOMINGO = 15 * 60;
const INTERVALO = 30;

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function aMinutos(hora) {
    const [h, m] = String(hora).split(':').map(Number);
    return h * 60 + m;
}

function aHora(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    return `${h}:${m}`;
}

function seCruzan(inicioA, finA, inicioB, finB) {
    return inicioA < finB && inicioB < finA;
}

function diaDeLaSemana(fecha) {
    return new Date(fecha + 'T12:00:00Z').getUTCDay();
}

function cierreDelDia(dia) {
    return Number(dia) === 0 ? CIERRE_DOMINGO : CIERRE;
}

const TEXTO_HORARIO = 'de lunes a sábado de 8:00 a 19:00 y los domingos de 8:00 a 15:00';

function ahoraColombia() {
    const colombia = new Date(Date.now() - 5 * 60 * 60 * 1000);
    return {
        fecha: colombia.toISOString().slice(0, 10),
        minutos: colombia.getUTCHours() * 60 + colombia.getUTCMinutes()
    };
}

function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return false;
    const d = new Date(fecha + 'T12:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === fecha;
}

function horaValida(hora) {
    if (!/^\d{2}:\d{2}$/.test(hora || '')) return false;
    const [h, m] = hora.split(':').map(Number);
    return h < 24 && m < 60;
}

module.exports = {
    APERTURA, CIERRE, CIERRE_DOMINGO, INTERVALO, DIAS, TEXTO_HORARIO, cierreDelDia,
    aMinutos, aHora, seCruzan, diaDeLaSemana, ahoraColombia, fechaValida, horaValida
};
