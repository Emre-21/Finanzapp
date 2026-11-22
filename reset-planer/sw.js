const CACHE = 'reset-planer-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('reset-planer-') && k !== CACHE && k !== DATA_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// ---------- Erinnerungen im Hintergrund (Android/Chrome, falls unterstützt) ----------
const DATA_CACHE='reset-planer-data', DATA_URL='./__reminders.json';
const pad=n=>String(n).padStart(2,'0');
const k=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const dd=(a,b)=>{const p=s=>{const [y,m,x]=s.split('-').map(Number);return new Date(y,m-1,x);};return Math.round((p(b)-p(a))/864e5);};
async function checkReminders(){
  const c=await caches.open(DATA_CACHE), r=await c.match(DATA_URL); if(!r) return;
  const o=await r.json(), sent=o.sent||{}, t=k(new Date());
  for(const d of (o.deadlines||[])){
    if(d.done) continue; const n=dd(t,d.date);
    const items=[];
    if(n>=1&&n<=3) items.push({tag:d.id+'-pre',title:'⏰ In '+n+(n===1?' Tag':' Tagen')+': '+d.title});
    if(n===0) items.push({tag:d.id+'-day',title:'📌 Heute: '+d.title});
    for(const it of items){ if(sent[it.tag]) continue; sent[it.tag]=Date.now(); await self.registration.showNotification(it.title,{tag:it.tag,icon:'icon-192.png',badge:'icon-192.png'}); }
  }
  o.sent=sent; await c.put(DATA_URL,new Response(JSON.stringify(o),{headers:{'Content-Type':'application/json'}}));
}
self.addEventListener('periodicsync',e=>{ if(e.tag==='reminders') e.waitUntil(checkReminders()); });
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c) return c.focus();} return self.clients.openWindow('./');}));
});
