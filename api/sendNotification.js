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

    /*
      IMPORTANTE:
      O Firebase estava recebendo vários tokens antigos.
      Então a notificação podia chegar por um token velho, mas o clique não obedecia ao service worker novo.
      Aqui usamos somente o token mais recente da lista.
    */
    const latestToken = validTokens[validTokens.length - 1];

    const finalTitle = String(title || "Nova mensagem no Zappi Web");
    const finalBody = String(body || "Você recebeu uma nova mensagem.");
    const finalUrl = buildAbsoluteUrl(url || "/");

    const message = {
      token: latestToken,

      data: {
        title: finalTitle,
        body: finalBody,
        url: finalUrl,
        click_action: finalUrl,
        type: "zappi_message"
      },

      webpush: {
        fcmOptions: {
          link: finalUrl
        },
        headers: {
          Urgency: "high"
        }
      }
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      ok: true,
      sentToLatestTokenOnly: true,
      messageId: response,
      url: finalUrl
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Erro interno ao enviar notificação."
    });
  }
};
