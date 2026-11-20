// js/api.js - Cliente API HTTP, Control de Sesión y Formatos Globales

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

/**
 * Peticiones HTTP unificadas al servidor backend
 */
async function pedir(endpoint, metodo = 'GET', datos = null) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const opciones = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const token = localStorage.getItem('token');
  if (token) {
    opciones.headers['Authorization'] = `Bearer ${token}`;
  }

  if (datos && ['POST', 'PUT', 'PATCH'].includes(metodo.toUpperCase())) {
    opciones.body = JSON.stringify(datos);
  }

  try {
    const respuesta = await fetch(url, opciones);
    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      // 401 = el token no existe o venció: se cierra la sesión y se vuelve al login
      if (respuesta.status === 401 && token && !/index\.html|recuperar\.html|register\.html/.test(location.pathname)) {
        localStorage.removeItem('usuarioLogueado');
        localStorage.removeItem('token');
        alert('Tu sesión expiró. Inicia sesión de nuevo.');
        window.location.href = 'index.html';
      }
      const texto = resultado.message || resultado.mensaje || resultado.error || `Error ${respuesta.status}: No se pudo procesar la solicitud.`;
      return { ...resultado, success: false, message: texto, mensaje: texto };
    }

    return { success: true, ...resultado };
  } catch (error) {
    console.warn(`[API] Sin conexión backend en ${url}. Usando persistencia local.`);
    return {
      success: false,
      errorRed: true,
      mensaje: 'Servidor local no detectado. Modo demostración activo.'
    };
  }
}

// Muestra un mensaje en una caja de alerta (recuperar contraseña, chat del visitante)
function mostrarAlerta(caja, mensaje, tipo = 'error') {
  if (!caja) return;
  caja.textContent = mensaje || '';
  caja.classList.remove('hidden', 'alerta-error', 'alerta-ok');
  caja.classList.add('block', tipo === 'ok' ? 'alerta-ok' : 'alerta-error');
}

function ocultarAlerta(caja) {
  if (!caja) return;
  caja.classList.add('hidden');
  caja.classList.remove('block');
}

// Formateadores globales
function pesos(valor) {
  const num = Number(valor) || 0;
  return '$' + num.toLocaleString('es-CO');
}

function escapar(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Control de Sesión en el Navegador
function obtenerUsuarioActual() {
  try {
    return JSON.parse(localStorage.getItem('usuarioLogueado')) || null;
  } catch (e) {
    return null;
  }
}

function guardarSesion(usuario, token = null) {
  if (usuario) {
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
  }
  if (token) {
    localStorage.setItem('token', token);
  }
}

function cerrarSesion() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}