// ── Service Worker ────────────────────────────────────────
// index.html은 캐시하지 않음 → GitHub 배포 즉시 반영
// 버전 번호 수동 변경 불필요
var CACHE_NAME = 'table-app-static-v1';

// 캐시할 파일: index.html 제외, 정적 자산만
var CACHE_FILES = [
  './manifest.json'
];

// ── 설치 ─────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  self.skipWaiting(); // 즉시 활성화
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES).catch(function() {});
    })
  );
});

// ── 활성화 ───────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch 전략 ───────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // 외부 요청(Firebase, CDN 등)은 그냥 통과
  if (url.includes('firebaseio.com') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com') ||
      url.includes('firebase')) {
    return;
  }

  // HTML 파일은 항상 네트워크 우선 → 캐시 안 함
  // → index.html이 바뀌면 바로 반영됨
  if (event.request.headers.get('accept') &&
      event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        // 오프라인일 때만 캐시에서 서빙
        return caches.match('./index.html');
      })
    );
    return;
  }

  // 나머지(manifest, 아이콘 등)는 캐시 우선
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
