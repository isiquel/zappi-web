importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Inicialize com cuidado! Não exponha suas chaves aqui se o seu repositório for público.
firebase.initializeApp({
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Notificação recebida em background:", payload);

  const notificationTitle = payload?.data?.title || "Nova mensagem";
  const notificationOptions = {
    body: payload?.data?.body || "Você recebeu uma nova mensagem.",
    icon: "/icon-192.png", // Certifique-se que este arquivo existe na raiz
    badge: "/icon-192.png",
    data: { url: payload?.data?.url || "/" }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
