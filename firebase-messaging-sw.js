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

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "Nova mensagem no Zappi Web";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "Você recebeu uma nova mensagem.";

  const url =
    payload.data?.url ||
    payload.fcmOptions?.link ||
    "/";

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "zappi-message",
    renotify: true,
    requireInteraction: false,
    data: {
      url
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification?.data?.url || "/";
  const urlToOpen = new URL(rawUrl, self.location.origin).href;

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
              url: rawUrl
            });

            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
