import { ref, push, get, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

// Função principal de envio
export async function sendMessage(chatId, text, recipientId) { 
  // 1. Escreve a mensagem no banco
  await push(ref(db, `chats/${chatId}/messages`), {
    text,
    sender: "user",
    time: serverTimestamp() 
  });

  try {
    // 2. Busca o token do destinatário usando a função auxiliar abaixo
    const token = await getTargetToken(recipientId); 

    if (!token) {
      console.log("Usuário não possui token registrado ou não encontrado.");
      return;
    }

    // 3. Envia para a API
    const response = await fetch("/api/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokens: [token], 
        title: "Nova mensagem",
        body: text,
        url: `/chat/${chatId}`
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

  } catch (error) {
    console.error("Falha no processo de envio:", error);
  }
}

// Função auxiliar (deve ficar no mesmo arquivo)
async function getTargetToken(uid) {
  // Ajuste o caminho 'users/${uid}/fcmToken' conforme a sua estrutura no Firebase
  const userRef = ref(db, `users/${uid}/fcmToken`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
}
