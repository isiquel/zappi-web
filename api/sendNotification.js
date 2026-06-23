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

    const { tokens, title, body, url, type } = req.body || {};

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Nenhum token informado."
      });
    }

    const validTokens = tokens.filter(Boolean);

    const finalTitle = String(title || "Nova mensagem");
    const finalBody = String(body || "Você recebeu uma notificação.");
    const finalUrl = buildAbsoluteUrl(url || "/");

    const isCall = type === "call";

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
        type: isCall ? "incoming_call" : "message",
        click_action: finalUrl
      },

      android: {
        priority: isCall ? "high" : "normal",
        notification: {
          sound: isCall ? "default" : "default",
          priority: "max",
          channelId: isCall ? "calls" : "messages",
          sticky: isCall,
          vibrateTimingsMillis: isCall
            ? [0, 1000, 500, 1000, 500, 1000]
            : [0, 300],
          visibility: "public"
        }
      },

      webpush: {
        headers: {
          Urgency: isCall ? "high" : "normal"
        },

        fcmOptions: {
          link: finalUrl
        },

        notification: {
          title: finalTitle,
          body: finalBody,

          icon: "/icon-192.png",
          badge: "/icon-192.png",

          requireInteraction: isCall,
          renotify: true,
          silent: false,

          tag: isCall ? "incoming-call" : "message",

          vibrate: isCall
            ? [1000, 500, 1000, 500, 1000]
            : [200],

          data: {
            url: finalUrl
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
