const ROLES_LOGIN = typeof ROLES !== 'undefined' ? ROLES : {
  cliente: {
    titulo: 'Clienta',
    imagen: 'img/rol_clienta.svg',
    descripcion: 'Agenda tus citas de belleza, elige tu especialista y gestiona tus reservas.'
  },
  estilista: {
    titulo: 'Estilista',
    imagen: 'img/logo.webp',
    descripcion: 'Consulta tu agenda diaria, citas asignadas y comisiones por servicio.'
  },
  admin: {
    titulo: 'Administradora',
    imagen: 'img/logo.webp',
    descripcion: 'Control ejecutivo de citas, caja, liquidación 60/40 y catálogo del salón.'
  }
};

let rolLoginActual = new URLSearchParams(window.location.search).get('rol');
if (!ROLES_LOGIN[rolLoginActual]) rolLoginActual = 'cliente';

function normalizarClaveRolLogin(rol) {
  const r = String(rol || '').toLowerCase().trim();
  if (!r) return '';
  if (r === 'admin' || r.includes('admin')) return 'admin';
  if (r === 'estilista' || r.includes('estilista')) return 'estilista';
  return 'cliente';
}

function obtenerTituloRolLogin(rol) {
  const clave = normalizarClaveRolLogin(rol);
  return ROLES_LOGIN[clave]?.titulo || 'Clienta';
}

function dibujarSelectorRolLogin() {
  const contenedor = document.getElementById('listaRoles');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  for (const clave in ROLES_LOGIN) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = ROLES_LOGIN[clave].titulo;
    const esActivo = clave === rolLoginActual;

    boton.className = `pestana py-2 px-3 rounded-lg font-semibold text-xs transition text-center ${
      esActivo ? 'pestana-activa bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

    boton.addEventListener('click', () => cambiarRolLogin(clave));
    contenedor.appendChild(boton);
  }
}

function cambiarRolLogin(clave) {
  if (!ROLES_LOGIN[clave]) clave = 'cliente';
  rolLoginActual = clave;

  const tituloEl = document.getElementById('tituloRol');
  const imagenEl = document.getElementById('imagenRol');
  const descEl = document.getElementById('descripcionRol');
  const enlaceReg = document.getElementById('enlaceRegistro');

  if (tituloEl) tituloEl.textContent = ROLES_LOGIN[clave].titulo;
  if (imagenEl) imagenEl.src = ROLES_LOGIN[clave].imagen;
  if (descEl) descEl.textContent = ROLES_LOGIN[clave].descripcion || '';
  if (enlaceReg) enlaceReg.href = `register.html?rol=${clave}`;

  const alerta = document.getElementById('alerta');
  if (alerta) alerta.style.display = 'none';

  dibujarSelectorRolLogin();

  const params = new URLSearchParams(window.location.search);
  params.set('rol', clave);
  history.replaceState(null, '', '?' + params.toString());
}

function activarBotonMostrarPassword() {
  const btn = document.getElementById('verPassword');
  const input = document.getElementById('password');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const oculto = input.type === 'password';
    input.type = oculto ? 'text' : 'password';
    btn.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  cambiarRolLogin(rolLoginActual);
  activarBotonMostrarPassword();

  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnEntrar') || form.querySelector('button[type="submit"]');

    const userInput = (document.getElementById('usuario')?.value || '').trim();
    const passInput = document.getElementById('password')?.value || '';

    if (!userInput || !passInput) {
      mostrarAlertaLogin(alerta, 'Ingresa tu usuario y tu contraseña.', 'error');
      return;
    }

    const rolSeleccionado = rolLoginActual;
    if (boton) boton.disabled = true;

    try {
      let resp = null;
      if (typeof pedir === 'function') {
        resp = await pedir('/login', 'POST', {
          usuario: userInput,
          username: userInput,
          password: passInput,
          rol: rolSeleccionado
        });
      } else {
        const resHttp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario: userInput,
            username: userInput,
            password: passInput,
            rol: rolSeleccionado
          })
        });
        resp = await resHttp.json();
        if (!resHttp.ok) resp.success = false;
      }

      if (!resp || resp.errorRed) {
        mostrarAlertaLogin(alerta, 'No se pudo conectar con el servidor. Verifica que esté activo.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      if (!resp.success) {
        mostrarAlertaLogin(alerta, resp.mensaje || resp.message || 'Usuario o contraseña incorrectos.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      const cuenta = resp.user || resp.usuario;
      if (!cuenta) {
        mostrarAlertaLogin(alerta, 'El servidor no devolvió los datos del usuario.', 'error');
        if (boton) boton.disabled = false;
        return;
      }

      const rolRealCuenta = normalizarClaveRolLogin(cuenta.rol);

      if (rolSeleccionado !== rolRealCuenta) {
        mostrarAlertaLogin(
          alerta,
          `Acceso denegado: esta cuenta fue creada únicamente con el rol de ${obtenerTituloRolLogin(rolRealCuenta)}. No puedes iniciar sesión como ${obtenerTituloRolLogin(rolSeleccionado)}.`,
          'error'
        );
        if (boton) boton.disabled = false;
        return;
      }

      const sesion = { ...cuenta, rol: rolRealCuenta };
      delete sesion.password;
      if (resp.token) localStorage.setItem('token', resp.token);
      localStorage.setItem('usuarioLogueado', JSON.stringify(sesion));

      mostrarAlertaLogin(
        alerta,
        `Bienvenido(a), ${sesion.nombre || sesion.usuario || sesion.username}. Ingresando como ${obtenerTituloRolLogin(rolRealCuenta)}...`,
        'ok'
      );

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');

      setTimeout(() => {
        if (rolRealCuenta === 'admin') {
          window.location.replace('admin.html');
        } else if (rolRealCuenta === 'estilista') {
          window.location.replace('panel.html?rol=estilista');
        } else if (redirect && /^[a-z]+\.html(#[a-z]+)?$/.test(redirect)) {
          window.location.replace(redirect);
        } else {
          window.location.replace('panel.html?rol=cliente');
        }
      }, 850);
    } catch (err) {
      mostrarAlertaLogin(alerta, 'Error inesperado al iniciar sesión.', 'error');
      if (boton) boton.disabled = false;
    }
  });
});

function mostrarAlertaLogin(el, msj, tipo = 'error') {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${tipo === 'ok' ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}
