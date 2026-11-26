// sw.js - Service worker de la PWA de BellaStyle (aplicación instalable).
// Reglas:
//  - /api/... nunca se guarda: los datos (citas, pagos, pedidos) siempre vienen del servidor.
//  - Páginas HTML: primero la red; si no hay internet, la copia guardada o la página "sin conexión".
//  - CSS, JS, imágenes y fuentes: se muestran desde la copia guardada y se actualizan por detrás.
const VERSION = 'bellastyle-v1';
const BASICOS = ['/offline.html', '/img/logo.webp', '/img/app/icono-192.png', '/css/estilos.css?v=45'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismoSitio = url.origin === self.location.origin;
  if (mismoSitio && url.pathname.startsWith('/api/')) return;      // datos: siempre en vivo
  if (mismoSitio && url.pathname.startsWith('/descargas/')) return; // el APK se descarga directo, sin guardarlo en caché

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  const estatico = mismoSitio ? /\.(css|js|webp|png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname)
    : /fonts\.(googleapis|gstatic)\.com|cdn\.tailwindcss\.com/.test(url.hostname);
  if (!estatico) return;
  e.respondWith(
    caches.open(VERSION).then((c) => c.match(req).then((guardado) => {
      const deRed = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => guardado);
      return guardado || deRed;
    }))
  );
});
