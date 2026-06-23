const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado.");
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT inválido.");
  }

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function buildAbsoluteUrl(url) {
  const baseUrl = "https://zappi-web.vercel.app";

  if (!url) return baseUrl + "/";

  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return baseUrl + url;

  return baseUrl + "/" + url;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  try {
    initFirebaseAdmin();

    const { tokens, title, body, url, type } = req.body || {};

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ ok: false, error: "Tokens inválidos." });
    }

    const finalTitle = String(title || "Zappi Web");
    const finalBody = String(body || "Nova notificação");
    const finalUrl = buildAbsoluteUrl(url || "/");

    const isCall = type === "call";

    const message = {
      tokens,

      notification: {
        title: finalTitle,
        body: finalBody,
      },

      data: {
        title: finalTitle,
        body: finalBody,
        url: finalUrl,
        type: type || "message",
      },

      // 🔥 ANDROID (AQUI É O QUE MELHORA O "TOQUE")
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: isCall ? "call_channel" : "message_channel",
        },
      },

      webpush: {
        headers: {
          Urgency: "high",
        },

        fcmOptions: {
          link: finalUrl,
        },

        notification: {
          title: finalTitle,
          body: finalBody,
          icon: "/icon-192.png",
          badge: "/icon-192.png",

          requireInteraction: true,

          // 🔥 vibração mais forte (simula "chamada")
          vibrate: isCall
            ? [500, 200, 500, 200, 500, 200, 800]
            : [200, 100, 200],

          tag: isCall ? "call" : "message",

          renotify: true,

          data: {
            url: finalUrl,
            type,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json({
      ok: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
