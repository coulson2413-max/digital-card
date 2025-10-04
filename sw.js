const CACHE_STATIC = 'digital-card-static-v3';
const ASSETS = [
  '/manifest.json',
  '/vcard.vcf',
  '/assets/avatar.jpg',        // 有圖就保留，沒有可以刪
  '/assets/company-mark.png'   // 同上
];

// 安裝：預快取靜態資源
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_STATIC).then(c => c.addAll(ASSETS)));
});

// 啟用：清掉舊版快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_STATIC ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// 取得：HTML 走「網路優先」，其他檔案走「快取優先」
self.addEventListener('fetch', e => {
  const req = e.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // 先網路，失敗才回快取（避免舊頁面）
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // 先快取，沒有再網路
    e.respondWith(
      caches.match(req).then(res => res || fetch(req))
    );
  }
});