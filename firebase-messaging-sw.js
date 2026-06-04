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

function getFullUrl(rawUrl) {
  if (!rawUrl) {
    return self.location.origin + "/";
  }

  if (String(rawUrl).startsWith("http://") || String(rawUrl).startsWith("https://")) {
    return String(rawUrl);
  }

  if (String(rawUrl).startsWith("/")) {
    return self.location.origin + String(rawUrl);
  }

  return self.location.origin + "/" + String(rawUrl);
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
    tag: "zappi-message-" + Date.now(),
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [250, 120, 250, 120, 250],
    data: {
      url
    },
    actions: [
      {
        action: "open",
        title: "Abrir conversa"
      }
    ]
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = getFullUrl(event.notification?.data?.url || "/");

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(async (clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);

        if (clientUrl.origin === self.location.origin) {
          if ("navigate" in client) {
            const navigatedClient = await client.navigate(urlToOpen);

            if (navigatedClient && "focus" in navigatedClient) {
              return navigatedClient.focus();
            }
          }

          if ("focus" in client) {
            client.postMessage({
              type: "OPEN_CHAT_FROM_NOTIFICATION",
              url: urlToOpen
            });

            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

      return null;
    })
  );
});
