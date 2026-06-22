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

/* =========================
   CICLO DO SERVICE WORKER
========================= */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* =========================
   FUNÇÃO DE URL SEGURA
========================= */

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

/* =========================
   PUSH EM SEGUNDO PLANO
========================= */

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};

  const chatId = data.chatId || "geral";
  const title = data.title || "Nova mensagem";
  const body = data.body || "Você recebeu uma mensagem";

  const priority = data.priority || "normal";

  const url = fullUrl(data.url || `/chat/${chatId}`);

  // 👉 AGRUPA POR CONVERSA (tipo WhatsApp)
  const tag = "chat-" + chatId;

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",

    tag: tag,
    renotify: true,

    requireInteraction: priority === "high",
    silent: priority === "low",

    vibrate:
      priority === "high"
        ? [300, 120, 300, 120, 300]
        : [200],

    data: {
      url: url,
      chatId: chatId
    }
  });
});

/* =========================
   CLIQUE NA NOTIFICAÇÃO
========================= */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = fullUrl(data.url || "/");

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      // 👉 se já estiver aberto, só foca
      for (const client of allClients) {
        if (client.url.includes(data.chatId) && "focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(urlToOpen);
    })()
  );
});
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "zappi-web.firebaseapp.com",
  databaseURL: "https://zappi-web-default-rtdb.firebaseio.com",
  projectId: "zappi-web",
  storageBucket: "zappi-web.firebasestorage.app",
  messagingSenderId: "675790989502",
  appId: "1:675790989502:web:36a7f3d1bcbb3bfb1b96ef"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
