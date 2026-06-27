// Service Worker - نظام تسجيل الغياب
const CACHE_NAME = 'church-attendance-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
];

// تثبيت السيرفس ووركر وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('تم فتح الكاش');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('فشل تحميل بعض الموارد:', err);
      });
    })
  );
  self.skipWaiting();
});

// تفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية: الكاش أولاً ثم الشبكة
self.addEventListener('fetch', event => {
  // تجاهل طلبات غير HTTP
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // تخزين الموارد الجديدة في الكاش
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حالة عدم الاتصال وعدم وجود كاش
        return new Response(
          '<html dir="rtl"><body style="font-family:Cairo,sans-serif;text-align:center;padding:50px"><h2>⚠️ لا يوجد اتصال بالإنترنت</h2><p>يرجى التحقق من اتصالك والمحاولة مجدداً</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
