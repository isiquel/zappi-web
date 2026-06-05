importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBXQJGJPREafTPDIpbzDSSov2Ju3kvei3w",
  authDomain: "zappi-web.firebaseapp.com",
  projectId: "zappi-web",
  storageBucket: "zappi-web.firebasestorage.app",
  messagingSenderId: "675790989502",
  appId: "1:675790989502:web:36a7f3d1bcbb3bfb1b96ef"
});

const messaging = firebase.messaging();

const APP_ORIGIN = "https://zappi-web.vercel.app";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function getFullUrl(rawUrl) {
  if (!rawUrl) {
    return APP_ORIGIN + "/";
  }

  const value = String(rawUrl);

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return APP_ORIGIN + value;
  }

  return APP_ORIGIN + "/" + value;
}

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.data?.title ||
    payload.notification?.title ||
    "Nova mensagem no Zappi Web";

  const body =
    payload.data?.body ||
    payload.notification?.body ||
    "Você recebeu uma nova mensagem.";

  const url = getFullUrl(
    payload.data?.url ||
    payload.data?.click_action ||
    payload.fcmOptions?.link ||
    "/"
  );

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    image: "/icon-192.png",
    tag: "zappi-message-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [300, 120, 300, 120, 300],
    data: {
      url,
      click_action: url
    },
    actions: [
      {
        action: "open_chat",
        title: "Abrir conversa"
      }
    ]
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = getFullUrl(
    event.notification?.data?.url ||
    event.notification?.data?.click_action ||
    "/"
  );

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of windowClients) {
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
          console.error("Erro ao focar janela existente:", error);
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(urlToOpen);
      }
    })()
  );
});
