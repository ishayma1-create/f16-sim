// F1 Sim service worker: caches the app shell + three.js so the game starts offline.
const VER='f1-v8', SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'no-cors':'same-origin'})).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const r=e.request; if(r.method!=='GET') return;
  e.respondWith(fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')){ const cp=res.clone(); caches.open(VER).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html')))); });
