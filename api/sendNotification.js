const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado na Vercel.");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
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

    const {
      tokens,
      title,
      body,
      url
    } = req.body || {};

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

    const message = {
      tokens: validTokens,
      notification: {
        title: title || "Nova mensagem no Zappi Web",
        body: body || "Você recebeu uma nova mensagem."
      },
      data: {
        url: url || "/"
      },
      webpush: {
        notification: {
          title: title || "Nova mensagem no Zappi Web",
          body: body || "Você recebeu uma nova mensagem.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: false
        },
        fcmOptions: {
          link: url || "/"
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
      error: error.message || "Erro interno ao enviar notificação."
    });
  }
};
