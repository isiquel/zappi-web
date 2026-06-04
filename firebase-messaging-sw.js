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
  const title = payload.notification?.title || "Nova mensagem no Zappi Web";
  const options = {
    body: payload.notification?.body || "Você recebeu uma nova mensagem.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: payload.data?.url || "/"
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
