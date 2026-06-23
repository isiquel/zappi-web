const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado na Vercel.");
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
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

    if (!Array.isArray(tokens) || !tokens.length) {
      return res.status(400).json({ ok: false, error: "Nenhum token informado." });
    }

    const validTokens = tokens.filter(Boolean);

    const finalTitle = String(title || "Nova notificação");
    const finalBody = String(body || "");
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
        type: type || "message"
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

          // 🔥 CHAMADAS FICAM MAIS “FORÇADAS”
          requireInteraction: isCall ? true : true,
          silent: false,

          // 🔊 VIBRAÇÃO FORTE (WHATSAPP-LIKE)
          vibrate: isCall
            ? [
                500, 200, 500, 200,
                500, 200, 500, 200,
                800
              ]
            : [
                200
              ],

          data: {
            url: finalUrl,
            type: type || "message"
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json({
      ok: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};
