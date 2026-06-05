const APP_ORIGIN = "https://zappi-web.vercel.app";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

function getPayloadData(event) {
  try {
    if (!event.data) return {};

    const payload = event.data.json();

    if (payload.data) {
      return payload.data;
    }

    if (payload.notification) {
      return {
        title: payload.notification.title,
        body: payload.notification.body,
        url: payload.fcmOptions?.link || payload.notification.click_action || "/"
      };
    }

    return payload;
  } catch (error) {
    console.error("Erro ao ler payload push:", error);
    return {};
  }
}

self.addEventListener("push", (event) => {
  const data = getPayloadData(event);

  const title = data.title || "Nova mensagem no Zappi Web";
  const body = data.body || "Você recebeu uma nova mensagem.";
  const url = fullUrl(data.url || data.click_action || "/");

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "zappi-message-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [300, 120, 300, 120, 300],
    data: {
      url
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
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
            if ("focus" in client) {
              await client.focus();
            }

            if ("navigate" in client) {
              await client.navigate(urlToOpen);
            }

            return;
          }
        } catch (error) {
          console.error("Erro ao focar app aberto:", error);
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

      return null;
    })()
  );
});
