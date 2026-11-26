async function cargarCobroSalon() {
  const r = await pedir('/pago-salon');
  const d = r && r.success ? r.data : null;
  if (!d) return;
  document.getElementById('llaveSalon').value = d.llave || '';
  document.getElementById('titularSalon').value = d.titular || '';
  if (d.qr) mostrarQr(d.qr);
  document.getElementById('avisoVistaPrevia').classList.add('hidden');
}

function mostrarQr(url) {
  const img = document.getElementById('vistaQrSalon');
  img.src = url;
  img.classList.remove('hidden');
  document.getElementById('sinQrSalon').classList.add('hidden');
}

function qrComoPng(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 800 / Math.max(img.width, img.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        const ctx = lienzo.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        resolve(lienzo.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = lector.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formPagoSalon');
  if (!form) return;
  cargarCobroSalon();

  document.getElementById('archivoQrSalon').addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    mostrarQr(URL.createObjectURL(archivo));
    document.getElementById('avisoVistaPrevia').classList.remove('hidden');
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const archivo = document.getElementById('archivoQrSalon').files[0];
    let imagen = null;
    if (archivo) {
      try { imagen = await qrComoPng(archivo); } catch (err) { notificarAdmin('No se pudo leer la imagen del QR.'); return; }
    }
    const r = await pedir('/pago-salon', 'PUT', {
      llave: document.getElementById('llaveSalon').value.trim(),
      titular: document.getElementById('titularSalon').value.trim(),
      imagen
    });
    notificarAdmin((r && r.message) || 'No se pudieron guardar los datos de cobro');
    if (r && r.success) { document.getElementById('archivoQrSalon').value = ''; cargarCobroSalon(); }
  });
});
