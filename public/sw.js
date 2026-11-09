// Install support only: nothing is cached, every request goes to the network as before.
// A page-load (navigation) that fails offline gets a branded bilingual screen instead of the browser's error page;
// it reloads by itself as soon as the connection is back.
// Having this fetch handler lets every Chromium browser (Chrome, Edge, Samsung Internet, Opera) offer its one-tap install.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const OFFLINE_HTML = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#FAF7F2"><title>وتزودوا · Watazawwado</title><style>
:root{--bg:#FAF7F2;--fg:#0A2E35;--muted:#5A5148;--gold:#E5A93C;--btn:#0A2E35;--on:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#110F0E;--fg:#FAF7F2;--muted:#B5AA9C;--btn:#FAF7F2;--on:#110F0E}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;background:var(--bg);color:var(--fg);
font:16px/1.6 system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;text-align:center;padding:24px max(24px,env(safe-area-inset-right)) 24px max(24px,env(safe-area-inset-left))}
main{display:grid;gap:18px;justify-items:center;max-width:360px}
svg{width:96px;height:96px}rect{fill:none;stroke:var(--gold);stroke-width:2.5}
.arch{fill:none;stroke:var(--fg);stroke-width:2.5;opacity:.85}
.dot{fill:var(--gold);animation:pulse 2s ease-in-out infinite;transform-origin:50px 56px}
h1{margin:0;font-size:22px;line-height:1.3}p{margin:0;color:var(--muted)}.en{font-size:14px}
button{margin-top:6px;width:100%;min-height:48px;border:0;border-radius:14px;background:var(--btn);color:var(--on);font:700 16px system-ui,sans-serif;cursor:pointer}
button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@keyframes pulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.dot{animation:none}}
</style></head><body><main>
<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="18" y="18" width="64" height="64" rx="3"/><rect x="18" y="18" width="64" height="64" rx="3" transform="rotate(45 50 50)"/>
<path class="arch" d="M38 70V52a12 12 0 0 1 24 0v18"/><circle class="dot" cx="50" cy="56" r="4"/></svg>
<h1>مفيش إنترنت دلوقتي</h1>
<p>أول ما النت يرجع، الصفحة هتفتح لوحدها.</p>
<p class="en" lang="en" dir="ltr">You are offline. This page reopens by itself when you are back online.</p>
<button type="button" onclick="location.reload()">جرّب تاني · Try again</button>
</main><script>addEventListener('online',function(){location.reload()});setInterval(function(){if(navigator.onLine)location.reload()},15000);</script></body></html>`;

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  );
});

// NX-09: phone notifications. The server sends {title, body, url, tag, icon, badge, action}; a tap (or the button) opens
// or focuses that page. icon is the picture on the side (Zaadi, or the sender's photo for a chat message).
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'وتزودوا · Watazawwado', {
    body: data.body || '',
    icon: data.icon || '/zaadi-notification-192.png',
    badge: data.badge || '/favicon-48x48.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    actions: data.action ? [{ action: 'open', title: data.action }] : [],
    data: { url: data.url || '/student' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/student', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    const same = wins.find((w) => w.url.startsWith(self.location.origin));
    if (same) { same.navigate(url); return same.focus(); }
    return self.clients.openWindow(url);
  }));
});
