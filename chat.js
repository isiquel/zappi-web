import { ref, push, get, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

// Função principal de envio
export async function sendMessage(chatId, text, recipientId) {
  // Validação básica
  if (!chatId) {
    console.error("chatId não informado.");
    return;
  }

  if (!recipientId) {
    console.error("recipientId não informado.");
    return;
  }

  // Limpa espaços e impede mensagem vazia
  const cleanText = text?.trim();

  if (!cleanText) {
    console.log("Mensagem vazia bloqueada.");
    return;
  }

  try {
    // 1. Salva mensagem no Realtime Database
    await push(ref(db, `chats/${chatId}/messages`), {
      text: cleanText,
      sender: "user",
      time: serverTimestamp()
    });

    console.log("Mensagem salva com sucesso.");

    // 2. Busca token do destinatário
    const token = await getTargetToken(recipientId);

    if (!token) {
      console.log("Usuário sem token registrado.");
      return;
    }

    // 3. Envia notificação push
    const response = await fetch("/api/sendNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tokens: [token],
        title: "Nova mensagem",
        body: cleanText,
        url: `/chat/${chatId}`
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    console.log("Notificação enviada com sucesso.");

  } catch (error) {
    console.error("Falha no processo de envio:", error);
  }
}

// Busca token do destinatário
async function getTargetToken(uid) {
  try {
    const userRef = ref(db, `users/${uid}/fcmToken`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();

  } catch (error) {
    console.error("Erro ao buscar token:", error);
    return null;
  }
}
