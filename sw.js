// Service worker: caches the app shell + three.js for offline start; map tiles are cached as you fly (size-capped).
const VER='f16-v3', SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
const TILE_CACHE='f16-tiles', MAX_TILES=1500;
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'no-cors':'same-origin'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER&&k!==TILE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function trim(cache){ const ks=await cache.keys(); if(ks.length>MAX_TILES) for(const k of ks.slice(0,ks.length-MAX_TILES)) await cache.delete(k); }
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  const isTile=/arcgisonline|terrarium|elevation-tiles|openstreetmap|eox\.at|tiles?\./i.test(u.hostname+u.pathname) || /\/\d+\/\d+\/\d+(\.\w+)?$/.test(u.pathname);
  if(isTile){      // tiles: cache first, then network (and remember)
    e.respondWith(caches.open(TILE_CACHE).then(async c=>{
      const hit=await c.match(r); if(hit) return hit;
      try{ const res=await fetch(r); if(res&&(res.ok||res.type==='opaque')){ c.put(r,res.clone()); trim(c); } return res; }catch(err){ return hit||Response.error(); }
    }));
    return;
  }
  // app shell: network first so updates arrive, fall back to cache offline
  e.respondWith(fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')){ const cp=res.clone(); caches.open(VER).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));
});
