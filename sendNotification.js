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

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  try {
    initFirebaseAdmin();

    const { tokens, title, body, url, photo, username } = req.body || {};

    if (!tokens?.length) {
      return res.status(400).json({ ok: false, error: "Sem tokens" });
    }

    const finalTitle = username || title || "Novo contato";
    const finalBody = body || "Enviou uma mensagem";
    const finalUrl = buildAbsoluteUrl(url || "/");

    const message = {
      tokens,

      data: {
        title: finalTitle,
        body: finalBody,
        url: finalUrl,
        photo: photo || "/icon-192.png",
        username: finalTitle,
        type: "message"
      },

      webpush: {
        headers: {
          Urgency: "high"
        },

        notification: {
          title: finalTitle,
          body: finalBody,

          icon: photo || "/icon-192.png",
          badge: "/icon-192.png",

          requireInteraction: true,

          data: {
            url: finalUrl,
            photo: photo || "/icon-192.png",
            username: finalTitle
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json({
      ok: true,
      success: response.successCount,
      failure: response.failureCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
