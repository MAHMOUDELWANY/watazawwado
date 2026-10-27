// Install support only: nothing is cached, every request goes to the network as before.
// A page-load (navigation) that fails offline gets a small bilingual notice instead of the browser's error page.
// Having this fetch handler lets every Chromium browser (Chrome, Edge, Samsung Internet, Opera) offer its one-tap install.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const OFFLINE_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Watazawwado</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FAF7F2;color:#05363F;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}
@media (prefers-color-scheme:dark){body{background:#110F0E;color:#FAF7F2}}button{margin-top:16px;height:44px;padding:0 22px;border:0;border-radius:999px;background:#087D91;color:#fff;font-weight:700}</style></head>
<body><div><p><b>مفيش إنترنت دلوقتي</b><br>You are offline right now.</p><button onclick="location.reload()">جرّب تاني · Try again</button></div></body></html>`;

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  );
});
