// 極簡版快取：首頁與必要資源
const CACHE = 'card-cache-v1';
const ASSETS = [
  '/',            // 部署在子路徑時可改成 '/index.html'
  '/index.html',
  '/manifest.json',
  '/vcard.vcf'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        // 靜態資源才快取（避免把 POST 或第三方 API 亂塞入）
        if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('/index.html'))
    )
  );
});
