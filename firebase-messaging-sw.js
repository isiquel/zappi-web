importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Firebase real do seu projeto
firebase.initializeApp({
  apiKey: "AIzaSyBXQJGJPREafTPDIpbzDSSov2Ju3kvei3w",
  authDomain: "zappi-web.firebaseapp.com",
  projectId: "zappi-web",
  storageBucket: "zappi-web.firebasestorage.app",
  messagingSenderId: "675790989502",
  appId: "1:675790989502:web:36a7f3d1bcbb3bfb1b96ef"
});

const messaging = firebase.messaging();

// Recebe notificação em background
messaging.onBackgroundMessage((payload) => {
  console.log("Notificação recebida:", payload);

  const notificationTitle =
    payload?.data?.title || "Nova mensagem";

  const notificationOptions = {
    body:
      payload?.data?.body || "Você recebeu uma nova mensagem.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: payload?.data?.url || "/"
    }
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Quando clicar na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
