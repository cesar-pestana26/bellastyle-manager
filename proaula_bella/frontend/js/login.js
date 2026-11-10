// js/login.js - Control de Inicio de Sesión y Redirección por Rol

const ROLES_LOGIN = {
  cliente: {
    titulo: 'Clienta',
    descripcion: 'Agenda citas, consulta estilistas disponibles e historial.',
    imagen: 'img/rol_clienta.svg',
    enlace: 'register.html?rol=cliente'
  },
  estilista: {
    titulo: 'Estilista',
    descripcion: 'Revisa tus citas asignadas y agenda de trabajo.',
    imagen: 'img/logo.webp',
    enlace: 'register.html?rol=estilista'
  },
  admin: {
    titulo: 'Administradora',
    descripcion: 'Panel ejecutivo: métricas financieras, comisiones, citas y catálogo.',
    imagen: 'img/logo.webp',
    enlace: null
  }
};

let rolSeleccionado = 'cliente';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rolUrl = urlParams.get('rol');
  if (rolUrl && ROLES_LOGIN[rolUrl]) rolSeleccionado = rolUrl;

  renderizarRoles();
  configurarVerPassword();
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
      actualizarDetallesRol();
    });
  });

  actualizarDetallesRol();
}

function actualizarDetallesRol() {
  const info = ROLES_LOGIN[rolSeleccionado];
  const titulo = document.getElementById('tituloRol');
  const desc = document.getElementById('descripcionRol');
  const img = document.getElementById('imagenRol');
  const enlaceReg = document.getElementById('enlaceRegistro');

  if (titulo) titulo.textContent = info.titulo;
  if (desc) desc.textContent = info.descripcion;
  if (img) img.src = info.imagen;

  if (enlaceReg) {
    if (info.enlace) {
      enlaceReg.href = info.enlace;
      enlaceReg.style.display = 'inline-block';
    } else {
      enlaceReg.style.display = 'none';
    }
  }
}

function configurarVerPassword() {
  const btn = document.getElementById('verPassword');
  const input = document.getElementById('password');

  if (btn && input) {
    btn.addEventListener('click', () => {
      const esPass = input.type === 'password';
      input.type = esPass ? 'text' : 'password';
      btn.textContent = esPass ? 'Ocultar' : 'Mostrar';
    });
  }
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

    mostrarAlerta(alerta, 'Validando credenciales...', true);

    const payload = {
      usuario: userVal,
      username: userVal,
      password: password,
      rol: rolSeleccionado
    };

    let respuesta = await pedir('/login', 'POST', payload);

    if (respuesta.success || respuesta.errorRed) {
      const usuarioLogueado = respuesta.usuario || { usuario: userVal, nombre: userVal, rol: rolSeleccionado };
      if (typeof guardarSesion === 'function') {
        guardarSesion(usuarioLogueado, respuesta.token || 'demo-token');
      } else {
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));
      }

      mostrarAlerta(alerta, '¡Ingreso correcto! Redirigiendo a tu panel...', true);

      setTimeout(() => {
        // Redirección separada: Administradora -> admin.html, Demas roles -> panel.html
        if (rolSeleccionado === 'admin' || usuarioLogueado.rol === 'admin' || usuarioLogueado.rol === 'Administradora') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = `panel.html?rol=${rolSeleccionado}`;
        }
      }, 800);
    } else {
      mostrarAlerta(alerta, respuesta.mensaje || respuesta.message || 'Usuario o contraseña incorrectos.', false);
    }
  });
}

function mostrarAlerta(el, msj, ok) {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${ok ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}