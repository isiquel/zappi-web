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
    return res.status(405).json({
      ok: false,
      error: "Método não permitido."
    });
  }

  try {
    initFirebaseAdmin();

    const { tokens, title, body, url, type } = req.body || {};

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Nenhum token informado."
      });
    }

    const validTokens = tokens.filter(Boolean);

    const finalTitle = String(title || "Nova notificação");
    const finalBody = String(body || "");
    const finalUrl = buildAbsoluteUrl(url || "/");

    const isCall = type === "call";

    const message = {
      tokens: validTokens,

      // 🔥 IMPORTANTE: sempre DATA-ONLY (melhor para background)
      data: {
        title: finalTitle,
        body: finalBody,
        url: finalUrl,
        type: type || "message",
        priority: isCall ? "high" : "normal"
      },

      android: {
        priority: "high",
        ttl: 60000
      },

      webpush: {
        headers: {
          Urgency: "high"
        },
        fcmOptions: {
          link: finalUrl
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json({
      ok: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      results: response.responses.map(r => ({
        success: r.success,
        error: r.error ? r.error.message : null
      }))
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Erro interno"
    });
  }
};
