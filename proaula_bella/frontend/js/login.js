// js/login.js - Selector de los 3 roles en #listaRoles y bloqueo estricto de rol cruzado

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

const CUENTAS_BASE_LOGIN = [
  { id: 1, nombre: 'Administradora Principal', usuario: 'admin', username: 'admin', email: 'admin@bellastyle.com', password: '123', rol: 'admin', telefono: '3000000001' },
  { id: 2, nombre: 'Diana Carmen', usuario: 'diana', username: 'diana', email: 'diana@bellastyle.com', password: '123', rol: 'estilista', especialidad: 'Especialista en Balayage & Color', telefono: '3000000002' },
  { id: 3, nombre: 'Sofía Martínez', usuario: 'sofia', username: 'sofia', email: 'sofia@bellastyle.com', password: '123', rol: 'estilista', especialidad: 'Manicura Rusa & Nail Art', telefono: '3000000003' },
  { id: 4, nombre: 'Mariana Sofía', usuario: 'cliente', username: 'cliente', email: 'cliente@bellastyle.com', password: '123', rol: 'cliente', telefono: '3001234567' }
];

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

function asegurarCuentasBaseLogin() {
  let lista = [];
  try {
    lista = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];
  } catch (e) {
    lista = [];
  }

  let modificado = false;
  CUENTAS_BASE_LOGIN.forEach(base => {
    const existe = lista.some(
      u => String(u.usuario || u.username || '').toLowerCase().trim() === base.usuario
    );
    if (!existe) {
      lista.push(base);
      modificado = true;
    }
  });

  if (modificado) {
    localStorage.setItem('usuariosRegistrados', JSON.stringify(lista));
  }
  return lista;
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
  asegurarCuentasBaseLogin();
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
    const listaUsuarios = asegurarCuentasBaseLogin();
    const identificadorNorm = userInput.toLowerCase();

    let cuenta = listaUsuarios.find(u => {
      const uUser = String(u.usuario || u.username || '').toLowerCase().trim();
      const uEmail = String(u.email || '').toLowerCase().trim();
      return uUser === identificadorNorm || (uEmail !== '' && uEmail === identificadorNorm);
    });

    if (boton) boton.disabled = true;

    try {
      if (typeof pedir === 'function') {
        const resp = await pedir('/login', 'POST', {
          usuario: userInput,
          username: userInput,
          password: passInput,
          rol: rolSeleccionado
        });

        if (resp && resp.success === false) {
          mostrarAlertaLogin(alerta, resp.mensaje || resp.message || 'Credenciales o rol incorrectos.', 'error');
          if (boton) boton.disabled = false;
          return;
        }

        if (resp && resp.success && resp.usuario) {
          cuenta = resp.usuario;
          if (resp.token) localStorage.setItem('token', resp.token);
        }
      }
    } catch (err) {}

    if (!cuenta) {
      mostrarAlertaLogin(alerta, 'No existe una cuenta registrada con ese usuario.', 'error');
      if (boton) boton.disabled = false;
      return;
    }

    if (cuenta.password && cuenta.password !== passInput) {
      mostrarAlertaLogin(alerta, 'La contraseña ingresada es incorrecta.', 'error');
      if (boton) boton.disabled = false;
      return;
    }

    // BLOQUEO ESTRICTO: La cuenta solo puede entrar con el rol con el que fue creada
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
    localStorage.setItem('usuarioLogueado', JSON.stringify(sesion));

    mostrarAlertaLogin(alerta, `Bienvenido(a), ${sesion.nombre || sesion.usuario}. Ingresando como ${obtenerTituloRolLogin(rolRealCuenta)}...`, 'ok');

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    setTimeout(() => {
      if (rolRealCuenta === 'admin') {
        window.location.replace('admin.html');
      } else if (rolRealCuenta === 'estilista') {
        window.location.replace('panel.html?rol=estilista');
      } else if (redirect) {
        window.location.replace(redirect);
      } else {
        window.location.replace('panel.html?rol=cliente');
      }
    }, 850);
  });
});

function mostrarAlertaLogin(el, msj, tipo = 'error') {
  if (!el) return;
  el.textContent = msj;
  el.className = `alerta ${tipo === 'ok' ? 'alerta-ok bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'alerta-error bg-rose-500/20 text-rose-300 border border-rose-500/30'} block p-3 rounded-xl mt-4 text-xs font-semibold`;
  el.style.display = 'block';
}