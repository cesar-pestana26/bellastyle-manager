// js/login.js - Control de Inicio de Sesión y Ruteo por Rol

const ROLES_LOGIN = {
  cliente: { titulo: 'Clienta', descripcion: 'Agenda citas y revisa tu historial.', imagen: 'img/rol_clienta.svg', enlace: 'register.html?rol=cliente' },
  estilista: { titulo: 'Estilista', descripcion: 'Revisa tus citas asignadas.', imagen: 'img/logo.webp', enlace: 'register.html?rol=estilista' },
  admin: { titulo: 'Administradora', descripcion: 'Panel ejecutivo: finanzas y catálogo.', imagen: 'img/logo.webp', enlace: null }
};

let rolSeleccionado = 'cliente';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rolUrl = urlParams.get('rol');
  if (rolUrl && ROLES_LOGIN[rolUrl]) rolSeleccionado = rolUrl;

  renderizarRoles();
  configurarFormularioLogin();
});

function renderizarRoles() {
  const contenedor = document.getElementById('listaRoles');
  if (!contenedor) return;

  contenedor.innerHTML = Object.keys(ROLES_LOGIN).map(key => `
    <button type="button" data-rol-login="${key}"
      class="py-2 px-3 rounded-lg font-semibold transition text-center ${key === rolSeleccionado ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'}">
      ${ROLES_LOGIN[key].titulo}
    </button>
  `).join('');

  contenedor.querySelectorAll('[data-rol-login]').forEach(btn => {
    btn.addEventListener('click', () => {
      rolSeleccionado = btn.dataset.rolLogin;
      renderizarRoles();
    });
  });
}

function configurarFormularioLogin() {
  const form = document.getElementById('formLogin');
  const alerta = document.getElementById('alerta');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!userVal || !password) {
      mostrarAlerta(alerta, 'Ingresa tu usuario y contraseña.', false);
      return;
    }

    const payload = { usuario: userVal, username: userVal, password, rol: rolSeleccionado };
    let respuesta = null;

    try {
      if (typeof pedir === 'function') {
        respuesta = await pedir('/login', 'POST', payload);
      }
    } catch (err) {}

    const usuarioLogueado = (respuesta && respuesta.usuario) || { usuario: userVal, nombre: userVal, rol: rolSeleccionado };
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));

    const r = String(usuarioLogueado.rol || rolSeleccionado || '').toLowerCase();
    const esAdmin = r === 'admin' || r === 'administradora' || r.includes('admin');

    mostrarAlerta(alerta, '¡Ingreso correcto! Redirigiendo...', true);

    setTimeout(() => {
      if (esAdmin) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'panel.html';
      }
    }, 600);
  });
}

function mostrarAlerta(el, msj, ok) {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${ok ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}