// Página de inicio de sesión (index.html)

let rolActual = 'cliente';

// Si la página se abre como index.html?rol=estilista, se preselecciona ese rol
const rolEnUrl = new URLSearchParams(window.location.search).get('rol');
if (ROLES[rolEnUrl]) rolActual = rolEnUrl;

// Si ya hay sesión abierta, se va directo al panel
if (obtenerSesion()) window.location.href = 'panel.html';

// Dibuja las pestañas del cuaderno, una por rol
function dibujarRoles() {
    const lista = document.getElementById('listaRoles');
    lista.innerHTML = '';

    for (const clave in ROLES) {
        const activo = clave === rolActual;
        const pestana = document.createElement('button');
        pestana.type = 'button';
        pestana.dataset.rol = clave;
        pestana.textContent = ROLES[clave].titulo;
        pestana.className = 'pestana-cuaderno rounded-xl lg:rounded-b-none '
            + (activo
                ? 'bg-bella-600 text-white lg:bg-[#fdf8f2] lg:text-bella-700 lg:pb-3'
                : 'bg-bella-100 text-bella-800 hover:bg-bella-200 lg:bg-bella-300 lg:hover:bg-bella-200');
        pestana.addEventListener('click', () => seleccionarRol(clave));
        lista.appendChild(pestana);
    }
}

function seleccionarRol(clave) {
    rolActual = clave;
    document.getElementById('tituloRol').textContent = ROLES[clave].titulo;
    document.getElementById('pieFoto').textContent = ROLES[clave].titulo;
    document.getElementById('descripcionRol').textContent = ROLES[clave].descripcion;
    document.getElementById('imagenRol').src = ROLES[clave].imagen;
    document.getElementById('enlaceRegistro').href = 'register.html?rol=' + clave;
    ocultarAlerta(document.getElementById('alerta'));
    dibujarRoles();
    document.getElementById('usuario').focus();
}

// Botón "Mostrar / Ocultar" contraseña
document.getElementById('verPassword').addEventListener('click', (e) => {
    const campo = document.getElementById('password');
    const oculto = campo.type === 'password';
    campo.type = oculto ? 'text' : 'password';
    e.target.textContent = oculto ? 'Ocultar' : 'Mostrar';
});

// Envío del formulario
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnEntrar');
    ocultarAlerta(alerta);

    boton.disabled = true;
    boton.textContent = 'Verificando...';

    const respuesta = await pedir('/login', 'POST', {
        username: document.getElementById('usuario').value,
        password: document.getElementById('password').value,
        rol: rolActual
    });

    if (respuesta.success) {
        guardarSesion(respuesta.user);
        window.location.href = 'panel.html';
    } else {
        mostrarAlerta(alerta, respuesta.message);
        boton.disabled = false;
        boton.textContent = 'Iniciar sesión';
    }
});

seleccionarRol(rolActual);
