const CACHE_NAME = "zappi-web-no-cache-v50";
const APP_ORIGIN = "https://zappi-web.vercel.app";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function fullUrl(rawUrl) {
  if (!rawUrl) return APP_ORIGIN + "/";

  const value = String(rawUrl);

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return APP_ORIGIN + value;
  }

  return APP_ORIGIN + "/" + value;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match("/"))
    );
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = fullUrl(event.notification?.data?.url || "/");

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);

          if (clientUrl.origin === APP_ORIGIN) {
            if ("navigate" in client) {
              await client.navigate(urlToOpen);
            }

            if ("focus" in client) {
              await client.focus();
            }

            return;
          }
        } catch (error) {
          console.error("Erro ao abrir cliente existente pelo sw.js:", error);
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

      return null;
    })()
  );
});