const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado na Vercel.");
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não é um JSON válido.");
  }

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

function buildAbsoluteUrl(url) {
  const baseUrl = "https://zappi-web.vercel.app";

  if (!url) return baseUrl + "/";

  const value = String(url);

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return baseUrl + value;
  }

  return baseUrl + "/" + value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método não permitido."
    });
  }

  try {
    initFirebaseAdmin();

    const { tokens, title, body, url } = req.body || {};

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Nenhum token informado."
      });
    }

    const validTokens = tokens.filter(Boolean);

    if (!validTokens.length) {
      return res.status(400).json({
        ok: false,
        error: "Tokens inválidos."
      });
    }

    const finalTitle = String(title || "📞 Chamada recebida");
    const finalBody = String(body || "Você está recebendo uma chamada.");
    const finalUrl = buildAbsoluteUrl(url || "/");

    const message = {
      tokens: validTokens,

      notification: {
        title: finalTitle,
        body: finalBody
      },

      data: {
        title: finalTitle,
        body: finalBody,
        url: finalUrl,
        type: "call",
        sound: "ringtone.mp3"
      },

      android: {
        priority: "high",
        notification: {
          sound: "ringtone.mp3",
          channelId: "call_channel",
          priority: "max",
          defaultVibrateTimings: false,
          vibrateTimings: [0, 1000, 500, 1000, 500, 1000],
          visibility: "public"
        }
      },

      apns: {
        headers: {
          "apns-priority": "10"
        },
        payload: {
          aps: {
            sound: "ringtone.mp3",
            category: "CALL",
            contentAvailable: true,
            mutableContent: true
          }
        }
      },

      webpush: {
        headers: {
          Urgency: "high"
        },

        fcmOptions: {
          link: finalUrl
        },

        notification: {
          title: finalTitle,
          body: finalBody,

          icon: "/icon-192.png",
          badge: "/icon-192.png",

          requireInteraction: true,
          silent: false,

          vibrate: [
            1000, 500, 1000, 500, 1000, 500, 1000
          ],

          data: {
            url: finalUrl,
            sound: "/ringtone.mp3"
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json({
      ok: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map(r => ({
        success: r.success,
        error: r.error ? r.error.message : null
      }))
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Erro interno ao enviar notificação."
    });
  }
};
