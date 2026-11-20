// js/panel.js - Panel Privado conectado a MySQL con Chat por Cita, Horario/Ausencias, Reprogramar, Calificaciones, Foto y Vitrina

let usuarioSesion = null;
let rolApiActual = 'Clienta';
let citasUsuario = [];
let serviciosGlobales = [];
let miPerfilClienta = null;
let miPerfilEstilista = null;
let versionFoto = Date.now();

const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

document.addEventListener('DOMContentLoaded', async () => {
  obtenerSesionValida();
  if (!usuarioSesion) return;

  const rolNorm = normalizarRolPanel(usuarioSesion.rol);
  if (rolNorm === 'admin') {
    window.location.replace('admin.html');
    return;
  }

  rolApiActual = rolNorm === 'estilista' ? 'Estilista' : 'Clienta';

  configurarHeader(rolNorm);
  inicializarFotoPerfil();
  inicializarChatCitaEventos();
  await cargarDatosIniciales(rolNorm);

  if (rolNorm === 'estilista') {
    await iniciarVistaEstilista();
  } else {
    await iniciarVistaClienta();
  }
});

function obtenerIdUsuarioActual() {
  return usuarioSesion?.id ?? usuarioSesion?.id_usuario ?? usuarioSesion?.idUsuario;
}

function normalizarRolPanel(rol) {
  const r = String(rol || '').toLowerCase().trim();
  if (r === 'admin' || r.includes('admin')) return 'admin';
  if (r === 'estilista' || r.includes('estilista')) return 'estilista';
  return 'cliente';
}

function obtenerSesionValida() {
  try {
    usuarioSesion = JSON.parse(localStorage.getItem('usuarioLogueado'));
  } catch (e) {
    usuarioSesion = null;
  }

  if (!usuarioSesion) {
    window.location.replace('index.html');
  }
}

function configurarHeader(rolNorm) {
  const nombreEl = document.getElementById('nombreUsuarioPanel');
  const badgeEl = document.getElementById('badgeRolPanel');
  const tituloSaludo = document.getElementById('tituloSaludo');
  const subtituloPanel = document.getElementById('subtituloPanel');

  const esEstilista = rolNorm === 'estilista';
  history.replaceState(null, '', `?rol=${rolNorm}`);

  if (nombreEl) nombreEl.textContent = usuarioSesion.nombre || usuarioSesion.usuario || usuarioSesion.username;
  if (badgeEl) {
    badgeEl.textContent = esEstilista ? 'Estilista' : 'Clienta';
    badgeEl.className = `text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
      esEstilista ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    }`;
  }

  if (tituloSaludo) {
    tituloSaludo.textContent = `Hola, ${usuarioSesion.nombre || usuarioSesion.usuario || usuarioSesion.username}`;
  }

  if (subtituloPanel) {
    subtituloPanel.textContent = esEstilista
      ? 'Gestiona tus citas asignadas, chatea con tus clientas, define tu horario, ausencias y vitrina.'
      : 'Revisa tus citas, chatea con tu estilista, reprograma, califica y descarga tus comprobantes PDF.';
  }

  const btnAgendar = document.getElementById('btnAgendarHeader');
  if (btnAgendar) {
    btnAgendar.style.display = esEstilista ? 'none' : 'inline-flex';
  }
}

// ---------------------------------------------------------------
// FOTO DE PERFIL (/api/usuarios/:id/foto)
// ---------------------------------------------------------------

function fotoDe(idUsuario) {
  return `/api/usuarios/${idUsuario}/foto?v=${versionFoto}`;
}

function mostrarFotoPerfil() {
  const idU = obtenerIdUsuarioActual();
  if (!idU) return;
  const imgHeader = document.getElementById('fotoUsuario');
  const imgPerfil = document.getElementById('fotoPerfil');
  if (imgHeader) imgHeader.src = fotoDe(idU);
  if (imgPerfil) imgPerfil.src = fotoDe(idU);
}

function inicializarFotoPerfil() {
  mostrarFotoPerfil();

  document.getElementById('btnCambiarFoto')?.addEventListener('click', () => {
    document.getElementById('archivoFotoPerfil')?.click();
  });

  document.getElementById('archivoFotoPerfil')?.addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;

    const idU = obtenerIdUsuarioActual();
    if (!idU) return mostrarToast('No se identificó el ID de tu cuenta.');

    let imagen;
    try {
      imagen = await comprimirImagenWebp(archivo, 500);
    } catch (err) {
      return mostrarToast(err.message || 'No se pudo procesar la imagen.');
    }

    const resp = await pedir(`/usuarios/${idU}/foto`, 'PUT', { imagen });
    mostrarToast(resp.message || resp.mensaje || 'Foto actualizada');
    if (resp.success) {
      versionFoto = Date.now();
      mostrarFotoPerfil();
    }
  });

  document.getElementById('btnQuitarFoto')?.addEventListener('click', async () => {
    const idU = obtenerIdUsuarioActual();
    if (!idU) return;
    const resp = await pedir(`/usuarios/${idU}/foto`, 'DELETE');
    mostrarToast(resp.message || resp.mensaje || 'Foto eliminada');
    versionFoto = Date.now();
    mostrarFotoPerfil();
  });
}

function comprimirImagenWebp(archivo, maxLado = 1200) {
  if (typeof reducirImagen === 'function') return reducirImagen(archivo, maxLado);
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('Imagen no válida'));
      img.src = lector.result;
    };
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

// ---------------------------------------------------------------
// CARGA DE CITAS DESDE MYSQL
// ---------------------------------------------------------------

function normalizarCitaServidor(c) {
  return {
    id: c.id_cita ?? c.id,
    id_clienta: c.id_clienta,
    id_servicio: c.id_servicio ?? c.idServicio,
    id_estilista: c.id_estilista ?? c.idEstilista,
    cliente: c.cliente || c.nombre_cliente || 'Clienta',
    servicio: c.servicio || c.nombre_servicio || 'Servicio',
    estilista: c.estilista || c.nombre_estilista || 'Por asignar',
    fecha: String(c.fecha || '').slice(0, 10),
    hora: String(c.hora || '').slice(0, 5),
    estado: c.estado || 'Pendiente',
    precio: Number(c.precio ?? c.valor ?? 0),
    reprogramaciones: Number(c.reprogramaciones || 0),
    calificacion: c.calificacion ? Number(c.calificacion) : null,
    notas_servicio: c.notas_servicio || '',
    observaciones: c.observaciones || '',
    sin_leer_clienta: Number(c.sin_leer_clienta || 0),
    sin_leer_estilista: Number(c.sin_leer_estilista || 0)
  };
}

async function cargarDatosIniciales(rolNorm) {
  serviciosGlobales = [];
  citasUsuario = [];

  try {
    const respSrv = await pedir('/servicios', 'GET');
    const listaSrv = Array.isArray(respSrv) ? respSrv : (respSrv?.data || []);
    if (Array.isArray(listaSrv)) serviciosGlobales = listaSrv;
  } catch (e) {}

  await recargarCitas(rolNorm);
}

async function recargarCitas(rolNorm) {
  const idUsuario = obtenerIdUsuarioActual();
  const rolApi = rolNorm === 'estilista' ? 'Estilista' : 'Clienta';

  try {
    const resp = await pedir(`/citas?rol=${encodeURIComponent(rolApi)}&idUsuario=${encodeURIComponent(idUsuario)}`, 'GET');
    const listaCruda = Array.isArray(resp) ? resp : (resp?.data || resp?.citas || []);
    citasUsuario = Array.isArray(listaCruda) ? listaCruda.map(normalizarCitaServidor) : [];
  } catch (e) {
    console.error('Error al cargar citas desde MySQL:', e);
    citasUsuario = [];
  }
}

function botonChatCita(idCita, sinLeer = 0) {
  const badge = Number(sinLeer) > 0
    ? `<span class="ml-1 rounded-full bg-pink-500 px-1.5 py-0.2 text-[10px] font-bold text-white">${sinLeer}</span>`
    : '';
  return `<button type="button" onclick="abrirChatCita(${idCita})" class="px-2 py-1 bg-white/10 text-white border border-white/15 rounded text-[11px] font-semibold hover:bg-white/20">Chat${badge}</button>`;
}

// ---------------------------------------------------------------
// VISTA CLIENTA (Datos, Citas, Chat, Reprogramar, Calificar, PDF, Vitrina)
// ---------------------------------------------------------------

async function iniciarVistaClienta() {
  const vClienta = document.getElementById('vistaClienta');
  const vEstilista = document.getElementById('vistaEstilista');

  if (vClienta) {
    vClienta.classList.remove('hidden');
    vClienta.style.display = 'block';
  }
  if (vEstilista) {
    vEstilista.classList.add('hidden');
    vEstilista.style.display = 'none';
  }

  await cargarMisDatosClienta();
  renderizarTablaCitasClienta();
  await cargarEstilistasClienta();

  document.getElementById('btnEditarMisDatos')?.addEventListener('click', modalEditarDatosClienta);

  setInterval(async () => {
    await recargarCitas('cliente');
    renderizarTablaCitasClienta();
  }, 15000);
}

async function cargarMisDatosClienta() {
  const idU = obtenerIdUsuarioActual();
  try {
    const resp = await pedir(`/clientas/usuario/${idU}`, 'GET');
    if (resp && resp.success && resp.data) {
      miPerfilClienta = resp.data;
    }
  } catch (e) {}

  const contenedor = document.getElementById('misDatosClienta');
  if (!contenedor) return;

  if (miPerfilClienta) {
    const c = miPerfilClienta;
    contenedor.innerHTML = `
      <div><span class="text-white/50">Nombre:</span> <strong class="text-white ml-1">${escapar(`${c.nombres} ${c.apellidos}`.trim())}</strong></div>
      <div><span class="text-white/50">Usuario:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.usuario || usuarioSesion.username || '')}</strong></div>
      <div><span class="text-white/50">Teléfono:</span> <strong class="text-white ml-1">${escapar(c.telefono || 'Sin registrar')}</strong></div>
      <div><span class="text-white/50">Correo:</span> <strong class="text-white ml-1">${escapar(c.email || 'Sin registrar')}</strong></div>
      <div><span class="text-white/50">Profesión:</span> <strong class="text-white ml-1">${escapar(c.profesion || 'No especificada')}</strong></div>
    `;
  } else {
    contenedor.innerHTML = `
      <div><span class="text-white/50">Nombre:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.nombre || usuarioSesion.usuario)}</strong></div>
      <div><span class="text-white/50">Usuario:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.usuario || usuarioSesion.username || '')}</strong></div>
      <div><span class="text-white/50">Teléfono:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.telefono || 'Sin registrar')}</strong></div>
      <div><span class="text-white/50">Correo:</span> <strong class="text-white ml-1">${escapar(usuarioSesion.email || 'Sin registrar')}</strong></div>
    `;
  }
}

function renderizarTablaCitasClienta() {
  const tabla = document.getElementById('tablaCitasClienta');
  if (!tabla) return;

  if (citasUsuario.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-white/50">No tienes citas agendadas aún.</td></tr>`;
    return;
  }

  tabla.innerHTML = citasUsuario.map(c => {
    const activa = c.estado === 'Pendiente' || c.estado === 'Confirmada';
    let acciones = botonChatCita(c.id, c.sin_leer_clienta) + ' ';

    if (activa) {
      const btnReprog = c.reprogramaciones >= 1
        ? `<span class="px-2 py-1 text-[10px] text-white/40" title="Cada cita se puede reprogramar una sola vez">Ya reprogramada</span>`
        : `<button type="button" onclick="reprogramarCita(${c.id})" class="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold hover:bg-amber-500/30">Reprogramar</button>`;

      const btnCancelar = `<button type="button" onclick="cancelarCitaClienta(${c.id})" class="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30">Cancelar</button>`;

      acciones += `${btnReprog} ${btnCancelar}`;
    } else if (c.estado === 'Finalizada') {
      const btnPdf = `<a href="/api/citas/${c.id}/comprobante" target="_blank" rel="noopener" class="px-2 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-semibold hover:bg-sky-500/30">PDF</a>`;
      const btnCalificar = c.calificacion
        ? `<span class="px-2 py-1 text-amber-300 font-bold text-xs" title="Tu calificación">${'★'.repeat(c.calificacion)}</span>`
        : `<button type="button" onclick="calificarCita(${c.id})" class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30">Calificar</button>`;

      acciones += `${btnPdf} ${btnCalificar}`;
    }

    return `
      <tr class="hover:bg-white/5 transition border-b border-white/5">
        <td class="p-3.5 font-bold text-white">${escapar(c.servicio)}</td>
        <td class="p-3.5 text-white/80">${escapar(c.estilista)}</td>
        <td class="p-3.5 text-pink-300 font-semibold whitespace-nowrap">${escapar(c.fecha)} · ${escapar(c.hora)}</td>
        <td class="p-3.5">${formatearEstadoBadge(c.estado)}</td>
        <td class="p-3.5 text-right space-x-1 whitespace-nowrap">${acciones}</td>
      </tr>
    `;
  }).join('');
}

window.reprogramarCita = function(idCita) {
  const cita = citasUsuario.find(c => String(c.id) === String(idCita));
  if (!cita) return;

  abrirVentana(`Reprogramar: ${cita.servicio}`,
    `<p class="text-xs text-white/70">Se mantiene la misma estilista (<strong class="text-pink-300">${escapar(cita.estilista)}</strong>). La cita vuelve a quedar pendiente.</p>
     <p class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Recuerda: cada cita se puede reprogramar <b>una sola vez</b>.</p>
     <div>
       <label for="vFechaReprog" class="text-xs text-white/70 block mb-1">Nueva fecha</label>
       <input id="vFechaReprog" type="date" value="${escapar(cita.fecha)}" min="${obtenerFechaHoy()}" class="campo" required>
     </div>
     <div>
       <label for="vHoraReprog" class="text-xs text-white/70 block mb-1">Nueva hora disponible (${escapar(cita.estilista)})</label>
       <select id="vHoraReprog" class="campo bg-[#120f1d]" required></select>
     </div>`,
    async () => {
      const nuevaFecha = document.getElementById('vFechaReprog')?.value;
      const nuevaHora = document.getElementById('vHoraReprog')?.value;
      if (!nuevaHora) {
        mostrarToast('Escoge una hora libre antes de guardar');
        return false;
      }

      const resp = await pedir(`/citas/${idCita}/reprogramar`, 'PUT', {
        fecha: nuevaFecha,
        hora: nuevaHora
      });

      mostrarToast(resp.message || resp.mensaje || (resp.success ? 'Cita reprogramada' : 'No se pudo reprogramar'));
      if (resp.success) {
        await recargarCitas('cliente');
        renderizarTablaCitasClienta();
        return true;
      }
      return false;
    }
  );

  async function cargarHorasReprogramar() {
    const select = document.getElementById('vHoraReprog');
    const fechaVal = document.getElementById('vFechaReprog')?.value;
    if (!select || !fechaVal) return;

    select.innerHTML = '<option value="">Buscando horas libres...</option>';
    const parametros = new URLSearchParams({
      idServicio: cita.id_servicio,
      idEstilista: cita.id_estilista,
      fecha: fechaVal,
      excluirCita: cita.id,
      idUsuario: obtenerIdUsuarioActual()
    });

    const resp = await pedir('/disponibilidad?' + parametros.toString(), 'GET');
    const horas = resp && resp.success && resp.data && Array.isArray(resp.data.horas)
      ? resp.data.horas
      : [];

    select.innerHTML = horas.length === 0
      ? '<option value="">No hay horas libres ese día</option>'
      : horas.map(h => `<option value="${escapar(h)}" ${h === cita.hora ? 'selected' : ''}>${escapar(h)}</option>`).join('');
  }

  document.getElementById('vFechaReprog')?.addEventListener('change', cargarHorasReprogramar);
  cargarHorasReprogramar();
};

window.calificarCita = function(idCita) {
  const cita = citasUsuario.find(c => String(c.id) === String(idCita));
  if (!cita) return;

  const opciones = [5, 4, 3, 2, 1].map(n => `
    <label class="flex cursor-pointer items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10">
      <input type="radio" name="vEstrellas" value="${n}" class="accent-pink-500" ${n === 5 ? 'checked' : ''}>
      <span class="text-amber-400 text-sm">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>
      <span class="text-xs text-white/70">(${n} ${n === 1 ? 'estrella' : 'estrellas'})</span>
    </label>
  `).join('');

  abrirVentana(`Califica tu ${cita.servicio}`,
    `<p class="text-xs text-white/70">Te atendió <strong class="text-pink-300">${escapar(cita.estilista)}</strong> el ${escapar(cita.fecha)}.</p>
     <div class="space-y-2">${opciones}</div>
     <div>
       <label for="vComentarioCal" class="text-xs text-white/70 block mb-1">Comentario (opcional)</label>
       <textarea id="vComentarioCal" rows="2" maxlength="300" class="campo" placeholder="Ej: Me encantó el resultado y la atención"></textarea>
     </div>`,
    async () => {
      const marcada = document.querySelector('input[name="vEstrellas"]:checked');
      const comentario = document.getElementById('vComentarioCal')?.value.trim() || '';

      const resp = await pedir(`/citas/${idCita}/calificacion`, 'POST', {
        idUsuario: obtenerIdUsuarioActual(),
        estrellas: Number(marcada?.value || 5),
        comentario
      });

      mostrarToast(resp.message || resp.mensaje || (resp.success ? '¡Gracias por tu calificación!' : 'No se pudo guardar'));
      if (resp.success) {
        await recargarCitas('cliente');
        renderizarTablaCitasClienta();
        await cargarEstilistasClienta();
        return true;
      }
      return false;
    }
  );
};

window.cancelarCitaClienta = async function(idCita) {
  if (!confirm('¿Deseas cancelar esta cita?')) return;

  const resp = await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: 'Cancelada' });
  if (!resp || resp.errorRed || !resp.success) {
    mostrarToast((resp && (resp.message || resp.mensaje)) || 'No se pudo cancelar la cita en el servidor');
    return;
  }

  mostrarToast('Cita cancelada correctamente');
  await recargarCitas('cliente');
  renderizarTablaCitasClienta();
};

function modalEditarDatosClienta() {
  const c = miPerfilClienta || {};
  abrirVentana('Editar Mis Datos',
    `<div class="space-y-3">
      <div>
        <label class="text-xs text-white/70 block mb-1">Nombres</label>
        <input id="vEditNombres" type="text" value="${escapar(c.nombres || usuarioSesion.nombre || '')}" class="campo" required>
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Apellidos</label>
        <input id="vEditApellidos" type="text" value="${escapar(c.apellidos || '')}" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Teléfono</label>
        <input id="vEditTel" type="text" value="${escapar(c.telefono || usuarioSesion.telefono || '')}" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Correo Electrónico</label>
        <input id="vEditEmail" type="email" value="${escapar(c.email || usuarioSesion.email || '')}" class="campo">
      </div>
      <div>
        <label class="text-xs text-white/70 block mb-1">Profesión</label>
        <input id="vEditProf" type="text" value="${escapar(c.profesion || usuarioSesion.profesion || '')}" class="campo">
      </div>
    </div>`,
    async () => {
      const nombres = document.getElementById('vEditNombres').value.trim();
      const apellidos = document.getElementById('vEditApellidos').value.trim();
      const telefono = document.getElementById('vEditTel').value.trim();
      const email = document.getElementById('vEditEmail').value.trim();
      const profesion = document.getElementById('vEditProf').value.trim();

      if (miPerfilClienta?.id_clienta) {
        const resp = await pedir(`/clientas/${miPerfilClienta.id_clienta}`, 'PUT', {
          nombres, apellidos, telefono, email, profesion
        });
        if (!resp.success) {
          mostrarToast(resp.message || 'No se pudieron actualizar los datos');
          return false;
        }
      }

      usuarioSesion.nombre = `${nombres} ${apellidos}`.trim();
      usuarioSesion.telefono = telefono;
      usuarioSesion.email = email;
      usuarioSesion.profesion = profesion;
      localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioSesion));

      configurarHeader('cliente');
      await cargarMisDatosClienta();
      mostrarToast('Datos actualizados correctamente');
      return true;
    }
  );
}

async function cargarEstilistasClienta() {
  const lista = document.getElementById('listaEstilistasClienta');
  if (!lista) return;

  const respEst = await pedir('/estilistas', 'GET');
  const estilistas = respEst && respEst.success && Array.isArray(respEst.data) ? respEst.data : [];

  if (estilistas.length === 0) {
    lista.innerHTML = `<p class="col-span-full text-xs text-white/60">Pronto conocerás a nuestro equipo de especialistas.</p>`;
    return;
  }

  const vitrinas = await Promise.all(estilistas.map(e => pedir(`/vitrina?idUsuario=${e.id_usuario}`, 'GET')));

  lista.innerHTML = estilistas.map((e, i) => {
    const fotos = (vitrinas[i]?.data || []).slice(0, 4);
    const trabajos = fotos.length === 0
      ? `<p class="text-[11px] text-white/50">Aún no ha subido fotos de sus trabajos.</p>`
      : `<div class="grid grid-cols-4 gap-2">${fotos.map(f => `
          <button type="button" data-ver="${escapar(f.url)}" data-texto="${escapar((f.descripcion ? f.descripcion + ' · ' : '') + e.nombres)}"
            class="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10">
            <img src="${escapar(f.url)}" alt="" loading="lazy" class="h-full w-full object-cover transition hover:scale-105">
          </button>`).join('')}</div>`;

    return `
      <article class="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div class="flex items-center gap-3">
          <img src="${fotoDe(e.id_usuario)}" alt="" class="h-12 w-12 shrink-0 rounded-2xl object-cover border border-white/15 bg-white/5">
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-sm text-white truncate">${escapar(`${e.nombres} ${e.apellidos || ''}`.trim())}</h4>
            <p class="truncate text-[11px] text-white/60">${escapar(e.servicios || 'Especialista BellaStyle')}</p>
          </div>
          <span class="shrink-0 text-xs font-bold ${e.num_calificaciones ? 'text-amber-300' : 'text-white/40'}">
            ${e.num_calificaciones ? `★ ${Number(e.promedio).toFixed(1)}` : 'Nueva'}
          </span>
        </div>
        <div>${trabajos}</div>
      </article>
    `;
  }).join('');

  lista.querySelectorAll('[data-ver]').forEach(b => {
    b.addEventListener('click', () => verFotoGrande(b.dataset.ver, b.dataset.texto));
  });
}

// ---------------------------------------------------------------
// CHAT DE LA CITA (CLIENTA <-> ESTILISTA)
// ---------------------------------------------------------------

const chatCita = { id: null, ultimo: 0, temporizador: null };

function inicializarChatCitaEventos() {
  document.getElementById('btnCerrarChat')?.addEventListener('click', cerrarChatCita);

  document.getElementById('ventanaChat')?.addEventListener('close', async () => {
    clearInterval(chatCita.temporizador);
    chatCita.id = null;
    if (rolApiActual === 'Clienta') {
      await recargarCitas('cliente');
      renderizarTablaCitasClienta();
    } else {
      await recargarCitas('estilista');
      renderizarTablaCitasEstilista();
    }
  });

  document.getElementById('formChatCita')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoTexto = document.getElementById('textoChatCita');
    const texto = campoTexto.value.trim();
    if (!texto || !chatCita.id) return;

    const resp = await pedir(`/citas/${chatCita.id}/mensajes`, 'POST', {
      rol: rolApiActual,
      idUsuario: obtenerIdUsuarioActual(),
      texto
    });

    if (!resp.success) {
      mostrarToast(resp.message || 'No se pudo enviar el mensaje');
      return;
    }

    campoTexto.value = '';
    if (chatCita.ultimo === 0) document.getElementById('mensajesCita').innerHTML = '';
    await cargarMensajesCita();
  });
}

window.abrirChatCita = function(idCita) {
  chatCita.id = idCita;
  chatCita.ultimo = 0;

  document.getElementById('mensajesCita').innerHTML = '';
  document.getElementById('tituloChat').textContent = 'Chat de la cita';
  document.getElementById('detalleChat').textContent = 'Cargando mensajes...';

  const modal = document.getElementById('ventanaChat');
  if (modal && !modal.open) modal.showModal();

  cargarMensajesCita();
  clearInterval(chatCita.temporizador);
  chatCita.temporizador = setInterval(cargarMensajesCita, 4000);
};

function cerrarChatCita() {
  const modal = document.getElementById('ventanaChat');
  if (modal) modal.close();
}

function dibujarMensajeCita(m) {
  const mio = m.autor === rolApiActual;
  document.getElementById('mensajesCita').insertAdjacentHTML('beforeend', `
    <div class="max-w-[82%] ${mio ? 'ml-auto text-right' : ''}">
      <p class="mb-1 text-[10px] text-white/50">${mio ? 'Tú' : escapar(m.autor)} · ${escapar(m.hora)}</p>
      <p class="inline-block whitespace-pre-line rounded-2xl px-3.5 py-2 text-left text-xs ${
        mio
          ? 'bg-pink-500 text-white'
          : 'border border-white/10 bg-white/10 text-white/90'
      }">${escapar(m.texto)}</p>
    </div>
  `);
}

async function cargarMensajesCita() {
  if (!chatCita.id) return;
  const params = new URLSearchParams({
    rol: rolApiActual,
    idUsuario: obtenerIdUsuarioActual(),
    desde: chatCita.ultimo
  });

  const resp = await pedir(`/citas/${chatCita.id}/mensajes?` + params.toString(), 'GET');
  if (!resp || !resp.success) {
    mostrarToast((resp && resp.message) || 'No se pudo cargar el chat');
    return cerrarChatCita();
  }

  const { cita, mensajes } = resp.data;
  const otraPersona = rolApiActual === 'Clienta' ? cita.estilista : cita.cliente;
  document.getElementById('tituloChat').textContent = `Chat con ${otraPersona}`;
  document.getElementById('detalleChat').textContent = `${cita.servicio} · ${cita.fecha} · ${cita.hora} · ${cita.estado}`;

  const caja = document.getElementById('mensajesCita');
  if (chatCita.ultimo === 0 && mensajes.length === 0) {
    caja.innerHTML = `<p class="text-center text-xs text-white/50 py-8">Todavía no hay mensajes en esta cita. Escribe el primero abajo.</p>`;
  } else if (mensajes.length > 0) {
    if (chatCita.ultimo === 0) caja.innerHTML = '';
    mensajes.forEach((m) => {
      dibujarMensajeCita(m);
      chatCita.ultimo = m.id;
    });
    caja.scrollTop = caja.scrollHeight;
  }

  document.getElementById('formChatCita').classList.toggle('hidden', !cita.abierto);
  const cerrado = document.getElementById('chatCerrado');
  cerrado.classList.toggle('hidden', cita.abierto);
  cerrado.textContent = `La cita quedó ${cita.estado.toLowerCase()}: el chat es solo de lectura.`;
}

// ---------------------------------------------------------------
// VISTA ESTILISTA (Agenda, Chat, Horario/Ausencias, Notas, Historial, Calificaciones, Vitrina)
// ---------------------------------------------------------------

async function iniciarVistaEstilista() {
  const vClienta = document.getElementById('vistaClienta');
  const vEstilista = document.getElementById('vistaEstilista');

  if (vClienta) {
    vClienta.classList.add('hidden');
    vClienta.style.display = 'none';
  }
  if (vEstilista) {
    vEstilista.classList.remove('hidden');
    vEstilista.style.display = 'block';
  }

  await cargarMiPerfilEstilista();
  renderizarMetricasEstilista();
  renderizarTablaCitasEstilista();
  await cargarMiHorario();
  await cargarMiVitrina();

  document.getElementById('btnAgregarVitrina')?.addEventListener('click', () => {
    agregarAVitrina(obtenerIdUsuarioActual(), cargarMiVitrina);
  });
  document.getElementById('btnMisOpiniones')?.addEventListener('click', () => {
    if (miPerfilEstilista) verOpinionesEstilista(miPerfilEstilista.id_estilista);
  });
  document.getElementById('btnEditarMiHorario')?.addEventListener('click', () => {
    if (miPerfilEstilista) editarHorarioEstilista(miPerfilEstilista.id_estilista);
  });
  document.getElementById('btnMisAusencias')?.addEventListener('click', () => {
    if (miPerfilEstilista) verAusenciasEstilista(miPerfilEstilista.id_estilista);
  });
  document.getElementById('btnEditarMisServicios')?.addEventListener('click', modalServiciosEstilista);

  setInterval(async () => {
    await recargarCitas('estilista');
    renderizarMetricasEstilista();
    renderizarTablaCitasEstilista();
  }, 15000);
}

async function cargarMiPerfilEstilista() {
  const idU = obtenerIdUsuarioActual();
  try {
    const resp = await pedir(`/estilistas/usuario/${idU}`, 'GET');
    if (resp && resp.success) miPerfilEstilista = resp.data;
  } catch (e) {}

  const contCal = document.getElementById('miCalificacion');
  if (!contCal) return;

  if (miPerfilEstilista && Number(miPerfilEstilista.num_calificaciones) > 0) {
    const prom = Number(miPerfilEstilista.promedio).toFixed(1);
    const num = Number(miPerfilEstilista.num_calificaciones);
    contCal.innerHTML = `
      <div class="flex items-end gap-3 pt-1">
        <span class="text-4xl font-bold font-serif text-white">${prom}</span>
        <div>
          <p class="text-amber-400 text-base">${'★'.repeat(Math.round(Number(prom)))}</p>
          <p class="text-xs text-white/60">${num} ${num === 1 ? 'opinión' : 'opiniones'} recibidas</p>
        </div>
      </div>
    `;
  } else {
    contCal.innerHTML = `<p class="text-xs text-white/60 pt-1">Aún no tienes calificaciones de clientas.</p>`;
  }
}

// ---------------------------------------------------------------
// HORARIO Y AUSENCIAS REALES EN MYSQL (/estilistas/:id/horario y /ausencias)
// ---------------------------------------------------------------

function generarOpcionesHora(valorSeleccionado, minMinutos, maxMinutos) {
  const selNorm = String(valorSeleccionado || '08:00').slice(0, 5);
  const opciones = [];
  for (let m = minMinutos; m <= maxMinutos; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const val = `${hh}:${mm}`;
    opciones.push(`<option value="${val}" ${val === selNorm ? 'selected' : ''}>${val}</option>`);
  }
  return opciones.join('');
}

async function cargarMiHorario() {
  const cont = document.getElementById('resumenMiHorario');
  if (!cont || !miPerfilEstilista) return;

  const resp = await pedir(`/estilistas/${miPerfilEstilista.id_estilista}/horario`, 'GET');
  const datos = resp && resp.data;
  if (!datos) {
    cont.innerHTML = '<p class="text-white/50">No se pudo cargar tu horario.</p>';
    return;
  }

  const activos = (datos.horario || [])
    .map((h) => `<span class="inline-block rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-white/85">${DIAS_SEMANA[h.dia_semana]}: <b>${String(h.hora_inicio).slice(0, 5)} - ${String(h.hora_fin).slice(0, 5)}</b></span>`)
    .join(' ');

  const ausenciasHtml = (datos.ausencias || []).length > 0
    ? `<p class="text-[11px] text-amber-300 pt-1">Ausencias activas: ${datos.ausencias.length} (clic en "Ausencias" para gestionar).</p>`
    : `<p class="text-[11px] text-white/50 pt-1">Sin ausencias programadas.</p>`;

  cont.innerHTML = `
    <div class="flex flex-wrap gap-1.5">${activos || '<span class="text-white/50">No tienes días laborales activos.</span>'}</div>
    ${ausenciasHtml}
  `;
}

async function editarHorarioEstilista(idEstilista) {
  const resp = await pedir(`/estilistas/${idEstilista}/horario`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return mostrarToast('No se pudo cargar el horario.');

  const filas = [1, 2, 3, 4, 5, 6].map((dia) => {
    const h = (datos.horario || []).find((x) => Number(x.dia_semana) === dia);
    return `
      <div class="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2">
        <label class="flex items-center gap-2 text-xs text-white">
          <input type="checkbox" name="vDia" value="${dia}" class="accent-pink-500" ${h ? 'checked' : ''}>
          ${DIAS_SEMANA[dia]}
        </label>
        <select id="vInicio${dia}" class="campo bg-[#120f1d] py-1.5 text-xs">${generarOpcionesHora(h ? h.hora_inicio : '08:00', 8 * 60, 18 * 60)}</select>
        <select id="vFin${dia}" class="campo bg-[#120f1d] py-1.5 text-xs">${generarOpcionesHora(h ? h.hora_fin : '19:00', 9 * 60, 19 * 60)}</select>
      </div>
    `;
  }).join('');

  abrirVentana('Mi Horario de Atención',
    `<p class="text-xs text-white/70">Marca los días que trabajas y define tu hora de entrada y salida. Los días sin marcar quedan libres.</p>
     <div class="grid grid-cols-[6.5rem_1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-white/50"><span>Día</span><span>Entrada</span><span>Salida</span></div>
     <div class="space-y-2">${filas}</div>`,
    async () => {
      const dias = [...document.querySelectorAll('input[name="vDia"]:checked')].map((c) => ({
        dia: Number(c.value),
        inicio: document.getElementById('vInicio' + c.value).value,
        fin: document.getElementById('vFin' + c.value).value
      }));

      const r = await pedir(`/estilistas/${idEstilista}/horario`, 'PUT', { dias });
      mostrarToast(r.message || (r.success ? 'Horario guardado en MySQL' : 'Error al guardar horario'));
      if (r.success) {
        await cargarMiHorario();
        return true;
      }
      return false;
    }
  );
}

async function verAusenciasEstilista(idEstilista) {
  const resp = await pedir(`/estilistas/${idEstilista}/horario`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return mostrarToast('No se pudieron cargar las ausencias.');

  const lista = (datos.ausencias || []).length === 0
    ? '<p class="text-xs text-white/60">No tienes ausencias registradas.</p>'
    : `<ul class="space-y-2 max-h-40 overflow-y-auto">${datos.ausencias.map((a) => `
        <li class="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs">
          <span>${escapar(String(a.fecha_inicio).slice(0, 10))} al ${escapar(String(a.fecha_fin).slice(0, 10))}${a.motivo ? ` · <span class="text-white/60">${escapar(a.motivo)}</span>` : ''}</span>
          <button type="button" data-quitar-ausencia="${a.id_ausencia}" class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold">Quitar</button>
        </li>
      `).join('')}</ul>`;

  abrirVentana('Mis Ausencias y Permisos',
    `${lista}
     <p class="border-t border-white/10 pt-3 text-xs font-bold text-pink-300">Registrar nueva ausencia</p>
     <div class="grid grid-cols-2 gap-3">
       <div>
         <label for="vAusDesde" class="text-xs text-white/70 block mb-1">Desde</label>
         <input id="vAusDesde" type="date" min="${obtenerFechaHoy()}" class="campo" required>
       </div>
       <div>
         <label for="vAusHasta" class="text-xs text-white/70 block mb-1">Hasta</label>
         <input id="vAusHasta" type="date" min="${obtenerFechaHoy()}" class="campo" required>
       </div>
     </div>
     <div>
       <label for="vAusMotivo" class="text-xs text-white/70 block mb-1">Motivo (opcional)</label>
       <input id="vAusMotivo" type="text" maxlength="120" placeholder="Ej: Vacaciones o cita médica" class="campo">
     </div>`,
    async () => {
      const desde = document.getElementById('vAusDesde').value;
      const hasta = document.getElementById('vAusHasta').value;
      const motivo = document.getElementById('vAusMotivo').value.trim();

      const r = await pedir(`/estilistas/${idEstilista}/ausencias`, 'POST', { desde, hasta, motivo });
      mostrarToast(r.message || (r.success ? 'Ausencia registrada' : 'No se pudo registrar'));
      if (r.success) {
        await cargarMiHorario();
        return true;
      }
      return false;
    }
  );

  document.querySelectorAll('[data-quitar-ausencia]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const r = await pedir(`/ausencias/${boton.dataset.quitarAusencia}`, 'DELETE');
      mostrarToast(r.message || 'Ausencia eliminada');
      await cargarMiHorario();
      verAusenciasEstilista(idEstilista);
    });
  });
}

async function verOpinionesEstilista(idEstilista) {
  const resp = await pedir(`/estilistas/${idEstilista}/calificaciones`, 'GET');
  const opiniones = (resp && resp.data) || [];

  const html = opiniones.length === 0
    ? '<p class="text-xs text-white/60">Todavía no has recibido opiniones.</p>'
    : `<div class="max-h-72 overflow-y-auto space-y-2.5">${opiniones.map(o => `
        <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div class="flex justify-between items-center text-xs">
            <strong class="text-white">${escapar(o.cliente || 'Clienta')}</strong>
            <span class="text-amber-400">${'★'.repeat(Number(o.estrellas || 5))}</span>
          </div>
          <p class="text-[11px] text-pink-300">${escapar(o.servicio || '')} · ${escapar(String(o.fecha || '').slice(0, 10))}</p>
          ${o.comentario ? `<p class="text-xs text-white/80">"${escapar(o.comentario)}"</p>` : ''}
        </div>
      `).join('')}</div>`;

  abrirVentana('Mis Opiniones y Calificaciones', html, null);
}

function renderizarMetricasEstilista() {
  const contenedor = document.getElementById('metricasEstilista');
  if (!contenedor) return;

  const totalCitas = citasUsuario.length;
  const pendientes = citasUsuario.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada').length;
  const finalizadas = citasUsuario.filter(c => c.estado === 'Finalizada').length;
  const ingresosBrutos = citasUsuario
    .filter(c => c.estado === 'Finalizada')
    .reduce((sum, c) => sum + (Number(c.precio) || 0), 0);
  const miComision = ingresosBrutos * 0.60;

  const fmt = (num) => typeof pesos === 'function' ? pesos(num) : '$' + num.toLocaleString('es-CO');
  const ico = (k) => typeof obtenerIcono === 'function' ? obtenerIcono(k, 'w-5 h-5') : '';

  contenedor.innerHTML = `
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-300 border border-pink-500/25 flex items-center justify-center">${ico('calendario')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Total Citas</span>
        <strong class="text-2xl font-serif text-white">${totalCitas}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center justify-center">${ico('reloj')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Por Atender</span>
        <strong class="text-2xl font-serif text-amber-300">${pendientes}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center justify-center">${ico('check')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Finalizadas</span>
        <strong class="text-2xl font-serif text-emerald-300">${finalizadas}</strong>
      </div>
    </div>
    <div class="tarjeta p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center justify-center">${ico('dinero')}</div>
      <div>
        <span class="text-xs uppercase text-white/50 font-semibold block">Mi Comisión (60%)</span>
        <strong class="text-2xl font-serif text-purple-300">${fmt(miComision)}</strong>
      </div>
    </div>
  `;
}

function renderizarTablaCitasEstilista() {
  const tabla = document.getElementById('tablaCitasEstilista');
  if (!tabla) return;

  if (citasUsuario.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-white/50">No tienes citas asignadas en tu agenda todavía.</td></tr>`;
    return;
  }

  tabla.innerHTML = citasUsuario.map(c => `
    <tr class="hover:bg-white/5 transition border-b border-white/5">
      <td class="p-3.5 font-mono text-white/50">BS-${c.id}</td>
      <td class="p-3.5 font-bold text-white">
        ${escapar(c.cliente)}
        ${c.id_clienta ? `<button type="button" onclick="verHistorialClienta(${c.id_clienta})" class="ml-1.5 text-[10px] text-pink-400 hover:underline font-normal">Historial</button>` : ''}
      </td>
      <td class="p-3.5 text-white/80">${escapar(c.servicio)}</td>
      <td class="p-3.5 text-pink-300 font-semibold whitespace-nowrap">${escapar(c.fecha)} · ${escapar(c.hora)}</td>
      <td class="p-3.5">${formatearEstadoBadge(c.estado)}</td>
      <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
        ${botonChatCita(c.id, c.sin_leer_estilista)}
        ${c.estado === 'Pendiente' ? `<button type="button" onclick="cambiarEstadoEstilista(${c.id}, 'Confirmada')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold">Confirmar</button>` : ''}
        ${c.estado === 'Confirmada' ? `<button type="button" onclick="cambiarEstadoEstilista(${c.id}, 'Finalizada')" class="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold">Finalizar</button>` : ''}
        ${c.estado === 'Finalizada' ? `<button type="button" onclick="editarNotasServicio(${c.id})" class="px-2 py-1 bg-white/10 text-white/80 border border-white/15 rounded text-[11px] font-semibold hover:bg-white/20">Notas</button>` : ''}
      </td>
    </tr>
  `).join('');
}

window.cambiarEstadoEstilista = async function(idCita, nuevoEstado) {
  const resp = await pedir(`/citas/${idCita}/estado`, 'PUT', { estado: nuevoEstado });
  if (!resp || resp.errorRed || !resp.success) {
    mostrarToast((resp && (resp.message || resp.mensaje)) || 'No se pudo actualizar el estado en el servidor');
    return;
  }

  mostrarToast(`Cita marcada como ${nuevoEstado}`);
  await recargarCitas('estilista');
  renderizarMetricasEstilista();
  renderizarTablaCitasEstilista();
};

window.verHistorialClienta = async function(idClienta) {
  const resp = await pedir(`/clientas/${idClienta}/historial`, 'GET');
  const datos = resp && resp.data;
  if (!datos) return mostrarToast('No se pudo cargar el historial.');

  const lista = datos.servicios.length === 0
    ? '<p class="text-xs text-white/60">Todavía no tiene servicios finalizados. Es su primera visita.</p>'
    : `<ol class="max-h-72 space-y-2.5 overflow-y-auto">${datos.servicios.map((s, i) => `
        <li class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs">
          <div class="flex justify-between gap-2">
            <strong class="text-white">${escapar(s.servicio)}</strong>
            <span class="text-white/50">${escapar(s.fecha)} · ${escapar(s.estilista)}</span>
          </div>
          ${i === 0 ? '<span class="text-[10px] font-bold text-pink-400">Última visita</span>' : ''}
          <p class="mt-1 text-white/80">${s.notas_servicio ? escapar(s.notas_servicio) : '<span class="text-white/40">Sin notas de la estilista</span>'}</p>
          ${s.calificacion ? `<p class="mt-1 text-amber-400">${'★'.repeat(Number(s.calificacion))}</p>` : ''}
        </li>
      `).join('')}</ol>`;

  abrirVentana(`Historial de ${datos.clienta.nombre}`,
    `<p class="text-xs text-white/70">Profesión: <strong class="text-white">${escapar(datos.clienta.profesion || 'No registrada')}</strong></p>${lista}`,
    null
  );
};

window.editarNotasServicio = function(idCita) {
  const c = citasUsuario.find(x => String(x.id) === String(idCita));
  abrirVentana(`Notas del servicio · ${c ? c.cliente : ''}`,
    `<p class="text-xs text-white/70">Anota productos, tono o técnica usada para la próxima visita de la clienta.</p>
     <div>
       <label for="vNotasServicio" class="text-xs text-white/70 block mb-1">Notas</label>
       <textarea id="vNotasServicio" rows="4" maxlength="500" class="campo" placeholder="Ej: Tinte 7.1 rubio ceniza, mascarilla de keratina.">${escapar(c?.notas_servicio || '')}</textarea>
     </div>`,
    async () => {
      const notas = document.getElementById('vNotasServicio')?.value.trim() || '';
      const resp = await pedir(`/citas/${idCita}/notas`, 'PUT', { notas });
      mostrarToast(resp.message || (resp.success ? 'Notas guardadas' : 'Error al guardar notas'));
      if (resp.success) {
        await recargarCitas('estilista');
        renderizarTablaCitasEstilista();
        return true;
      }
      return false;
    }
  );
};

// ---------------------------------------------------------------
// VITRINA DE TRABAJOS (/vitrina)
// ---------------------------------------------------------------

function verFotoGrande(url, texto) {
  const visor = document.getElementById('visorFoto');
  if (!visor) return;
  document.getElementById('visorImagen').src = url;
  document.getElementById('visorTexto').textContent = texto || '';
  if (!visor.open) visor.showModal();
}

async function cargarMiVitrina() {
  const contenedor = document.getElementById('miVitrina');
  if (!contenedor) return;

  const idU = obtenerIdUsuarioActual();
  const resp = await pedir(`/vitrina?idUsuario=${idU}`, 'GET');
  const fotos = (resp && resp.data) || [];

  if (fotos.length === 0) {
    contenedor.innerHTML = `
      <div class="rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-white/60">
        Todavía no has subido fotos a tu vitrina. Haz clic en <strong>+ Agregar foto</strong> para mostrar tus trabajos.
      </div>`;
    return;
  }

  contenedor.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${fotos.map(f => `
    <figure class="group relative aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10">
      <button type="button" data-ver="${escapar(f.url)}" data-texto="${escapar(f.descripcion || '')}" class="h-full w-full">
        <img src="${escapar(f.url)}" alt="${escapar(f.descripcion || 'Trabajo')}" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
      </button>
      ${f.descripcion ? `<figcaption class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-[11px] text-white">${escapar(f.descripcion)}</figcaption>` : ''}
      <div class="absolute right-2 top-2 flex gap-1">
        <button type="button" data-editar-vitrina="${f.id_foto}" data-descripcion="${escapar(f.descripcion || '')}" class="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-semibold">Editar</button>
        <button type="button" data-quitar-vitrina="${f.id_foto}" class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-semibold">Quitar</button>
      </div>
    </figure>
  `).join('')}</div>`;

  contenedor.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => verFotoGrande(b.dataset.ver, b.dataset.texto)));
  contenedor.querySelectorAll('[data-quitar-vitrina]').forEach(b => b.addEventListener('click', async () => {
    const r = await pedir(`/vitrina/${b.dataset.quitarVitrina}?idUsuario=${idU}`, 'DELETE');
    mostrarToast(r.message || 'Foto eliminada');
    await cargarMiVitrina();
  }));
  contenedor.querySelectorAll('[data-editar-vitrina]').forEach(b => b.addEventListener('click', () => {
    abrirVentana('Editar descripción',
      `<div>
        <label for="vDescVitrina" class="text-xs text-white/70 block mb-1">Descripción</label>
        <input id="vDescVitrina" type="text" maxlength="120" value="${escapar(b.dataset.descripcion)}" class="campo">
      </div>`,
      async () => {
        const desc = document.getElementById('vDescVitrina').value.trim();
        const r = await pedir(`/vitrina/${b.dataset.editarVitrina}`, 'PUT', { idUsuario: idU, descripcion: desc });
        mostrarToast(r.message || 'Descripción actualizada');
        if (r.success) {
          await cargarMiVitrina();
          return true;
        }
        return false;
      }
    );
  }));
}

function agregarAVitrina(idUsuario, recargar) {
  abrirVentana('Agregar a mi vitrina',
    `<div>
      <label for="vDescNuevaVitrina" class="text-xs text-white/70 block mb-1">Descripción (opcional, escríbela antes de escoger fotos)</label>
      <input id="vDescNuevaVitrina" type="text" maxlength="120" placeholder="Ej: Balayage miel en cabello largo" class="campo">
    </div>
    <div>
      <label for="vArchivosVitrina" class="text-xs text-white/70 block mb-1">Selecciona fotos (JPG, PNG o WEBP)</label>
      <input id="vArchivosVitrina" type="file" accept="image/jpeg,image/png,image/webp" multiple class="campo">
      <p class="mt-1.5 text-[11px] text-white/50">Se suben automáticamente apenas las seleccionas.</p>
    </div>`,
    null
  );

  document.getElementById('vArchivosVitrina')?.addEventListener('change', async (e) => {
    const archivos = [...e.target.files];
    if (!archivos.length) return;
    const descripcion = document.getElementById('vDescNuevaVitrina')?.value.trim() || '';

    let subidas = 0;
    for (const archivo of archivos) {
      mostrarToast(`Subiendo ${subidas + 1} de ${archivos.length}...`);
      const imagen = await comprimirImagenWebp(archivo, 1200);
      const r = await pedir('/vitrina', 'POST', { idUsuario, imagen, descripcion });
      if (!r.success) {
        mostrarToast(r.message || 'Error al subir foto');
        break;
      }
      subidas++;
    }

    cerrarVentana();
    if (subidas > 0) mostrarToast(subidas === 1 ? 'Foto agregada a tu vitrina' : `${subidas} fotos agregadas`);
    await recargar();
  });
}

function modalServiciosEstilista() {
  abrirVentana('Mis Servicios de Especialidad',
    `<p class="text-xs text-white/70 mb-3">Servicios registrados en el salón:</p>
     <div class="space-y-2 text-xs max-h-64 overflow-y-auto">
       ${serviciosGlobales.map(s => `
         <div class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
           <span class="text-white">${escapar(s.nombre)}</span>
           <span class="text-white/50">${s.duracion_min || 45} min</span>
         </div>
       `).join('')}
     </div>`,
    null
  );
}

// ---------------------------------------------------------------
// UTILIDADES DE VENTANA Y FORMATO
// ---------------------------------------------------------------

let alGuardarVentana = null;

function abrirVentana(titulo, html, alGuardar) {
  const tit = document.getElementById('tituloVentana');
  const camp = document.getElementById('camposVentana');
  const btnGuardar = document.getElementById('btnGuardarVentana');

  if (tit) tit.textContent = titulo;
  if (camp) camp.innerHTML = html;
  alGuardarVentana = alGuardar;

  if (btnGuardar) {
    btnGuardar.style.display = alGuardar ? 'inline-flex' : 'none';
  }

  const ventana = document.getElementById('ventana');
  if (ventana && !ventana.open) ventana.showModal();
}

window.cerrarVentana = function() {
  const ventana = document.getElementById('ventana');
  if (ventana) ventana.close();
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formVentana');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!alGuardarVentana) {
        cerrarVentana();
        return;
      }
      const ok = await alGuardarVentana();
      if (ok) cerrarVentana();
    });
  }
});

function formatearEstadoBadge(estado) {
  const estilos = {
    Pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Confirmada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Finalizada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const cls = estilos[estado] || 'bg-white/10 text-white/80 border-white/20';
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}">${escapar(estado)}</span>`;
}

function mostrarToast(msj) {
  const av = document.getElementById('aviso');
  if (!av) return;
  av.textContent = msj;
  av.classList.remove('opacity-0', '-translate-y-4');
  clearTimeout(av.timer);
  av.timer = setTimeout(() => av.classList.add('opacity-0', '-translate-y-4'), 3000);
}

function obtenerFechaHoy() {
  const hoy = new Date();
  return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function escapar(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.cerrarSesionPanel = function() {
  localStorage.removeItem('usuarioLogueado');
  localStorage.removeItem('token');
  window.location.replace('index.html');
};