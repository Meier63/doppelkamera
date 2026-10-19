// Offline-Speicher für Doppel 15 Kamera (nur wirksam, wenn das Spiel über eine Webadresse aufgerufen wird).
// Vorgehen: immer zuerst die aktuelle Fassung aus dem Netz holen und merken;
// ohne Netz (oder nach 4 Sekunden ohne Antwort) die gemerkte Fassung verwenden.

const CACHE = 'doppelkamera-v6';
const DATEIEN = ['./', 'index.html', 'doppelkamera.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function mitZeitlimit(p, ms) {
  return new Promise((ok, fehler) => {
    const t = setTimeout(() => fehler(new Error('Zeitlimit')), ms);
    p.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); fehler(e); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    mitZeitlimit(fetch(req), 4000)
      .then(res => {
        if (res.ok) {
          const kopie = res.clone();
          caches.open(CACHE).then(c => c.put(req, kopie));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(r => r || (req.mode === 'navigate' ? caches.match('doppelkamera.html') : null))
          .then(r => r || Response.error())
      )
  );
});
