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

/* =========================
   BACKGROUND HANDLER FOR CALLS
========================= */

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};

  const isCall = data.type === "call";

  const title = isCall
    ? "📞 Chamada recebida"
    : (data.title || "Nova mensagem");

  const body = data.body || "";

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",

    // 🔥 ESSENCIAL PARA NÃO “SUMIR”
    requireInteraction: true,

    // 🔥 NÃO SILENCIAR
    silent: false,

    // 🔥 TAG EVITA AGRUPAR ERRADO
    tag: isCall ? "incoming-call" : "message",

    renotify: true,

    // 🔥 VIBRAÇÃO FORTE ESTILO CHAMADA
    vibrate: isCall
      ? [
          800, 200,
          800, 200,
          800, 200,
          1000
        ]
      : [
          300
        ],

    data: {
      url: data.url || "/",
      type: data.type
    }
  });
});

/* =========================
   CLICK NA NOTIFICAÇÃO
========================= */

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});
