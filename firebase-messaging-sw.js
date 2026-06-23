importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// 🔊 cria áudio global
let audio = null;

function playRingtone() {
  try {
    if (!audio) {
      audio = new Audio("/ringtone.mp3");
      audio.loop = true;
      audio.volume = 1.0;
    }

    audio.play().catch(() => {
      // alguns browsers bloqueiam até interação
    });

  } catch (e) {
    console.log("Erro ao tocar ringtone:", e);
  }
}

function stopRingtone() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

// 📳 vibração contínua
function vibrateCall() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
    }
  } catch (e) {}
}

// 📩 quando chega mensagem em background
messaging.onBackgroundMessage(function (payload) {
  console.log("📞 CALL RECEBIDA:", payload);

  const title = payload?.data?.title || "Chamada recebida";
  const body = payload?.data?.body || "Toque para atender";

  // 🔥 notificação estilo chamada
  self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    requireInteraction: true,
    silent: false,
    vibrate: [1000, 500, 1000, 500, 1000],
    data: payload?.data || {}
  });

  // 🔊 tenta tocar ringtone
  playRingtone();

  // 📳 vibra
  vibrateCall();
});

// 👆 quando usuário clica na notificação
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  stopRingtone();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.openWindow(url)
  );
});
