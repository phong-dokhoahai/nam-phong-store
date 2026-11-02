/* Service worker: caches the app shell so the app opens fast and offline.
 *
 * `sw-manifest.js` is generated at build time (see `pwaManifestPlugin` in
 * vite.config.ts) and defines `self.__PWA_MANIFEST__ = { version, assets }`.
 * A new build changes that file, which makes the browser install a new
 * worker; it waits until the page asks it to take over (update prompt).
 *
 * Supabase requests are never intercepted: data freshness and offline
 * snapshots are handled by the app (`src/lib/offline/`).
 */
importScripts("/sw-manifest.js");

const { version, assets } = self.__PWA_MANIFEST__;
const SHELL_CACHE = `shell-${version}`;
const RUNTIME_CACHE = "runtime-v1";
const APP_SHELL_URL = "/index.html";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([APP_SHELL_URL, ...assets])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("shell-") && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** Network first so a deploy is seen at once; cached shell when offline. */
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(APP_SHELL_URL);
    return cached || Response.error();
  }
}

/** Hashed build assets never change under the same URL. */
async function precachedOrRevalidate(request) {
  const shell = await caches.open(SHELL_CACHE);
  const cached = await shell.match(request);
  return cached || staleWhileRevalidate(request);
}

/** Serve the cached copy (if any) and refresh it in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || Response.error());

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") {
      event.respondWith(handleNavigation(request));
      return;
    }
    // The worker files themselves must always come from the network.
    if (url.pathname === "/sw.js" || url.pathname === "/sw-manifest.js") {
      return;
    }
    event.respondWith(precachedOrRevalidate(request));
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
