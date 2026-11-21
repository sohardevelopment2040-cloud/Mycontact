// Service Worker — صور جهات الاتصال
const CACHE = 'contacts-photos-v4';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // يحفظ كل ملف على حدة، فلا يتوقف التثبيت إذا نقص ملف واحد
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // صفحات التطبيق: الشبكة أولاً ثم النسخة المحفوظة (لتصلك التحديثات)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // باقي الملفات والخطوط: المحفوظ أولاً ثم الشبكة
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && (url.origin === location.origin || url.host.includes('fonts.g'))) {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => hit))
  );
});
