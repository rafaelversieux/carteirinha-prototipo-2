// Service worker da carteirinha: guarda o app no celular para abrir mesmo sem internet.
// O build troca a versão a cada mudança, e a versão antiga é apagada ao ativar.
const CACHE = 'carteirinha-06d6365622';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const guardaCopia = (pedido, resposta) => {
  const copia = resposta.clone();
  caches.open(CACHE).then(c => c.put(pedido, copia));
  return resposta;
};

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // rede primeiro (pega a versão nova), cache se estiver offline
    e.respondWith(fetch(e.request).then(r => guardaCopia(e.request, r))
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => guardaCopia(e.request, resp))));
  }
});
