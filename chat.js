import { ref, push, get } from "firebase/database";
import { db } from "./firebase";

export async function sendMessage(chatId, text) {

  await push(ref(db, "chats/" + chatId + "/messages"), {
    text,
    sender: "user",
    time: Date.now()
  });

  try {

    const tokensSnap = await get(ref(db, "pushTokens"));

    const tokens = [];

    if (tokensSnap.exists()) {

      const data = tokensSnap.val();

      Object.keys(data).forEach((key) => {

        const token = data[key];

        if (token) {
          tokens.push(token);
        }

      });
    }

    if (!tokens.length) {
      console.log("Nenhum token encontrado");
      return;
    }

    await fetch("/api/sendNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tokens,
        title: "Nova mensagem",
        body: text,
        url: "/"
      })
    });

  } catch (error) {

    console.error(
      "Erro ao enviar notificação:",
      error
    );

  }
}
