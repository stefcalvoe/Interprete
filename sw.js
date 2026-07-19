/* Intérprete SW v2 — abre la app y las charlas guardadas sin internet */
const CACHE = 'interprete-v2';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // La app misma: red primero (para recibir actualizaciones), caché si no hay internet
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() =>
        caches.match(e.request).then(m => m || caches.match('./index.html'))
      )
    );
    return;
  }

  // Fuentes de Google: caché primero (no cambian)
  if (url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }))
    );
  }
  // El traductor NO se cachea: siempre necesita internet
});
