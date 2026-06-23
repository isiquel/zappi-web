import { ref, push } from "firebase/database";
import { db } from "./firebase";

export async function sendMessage(chatId, text, tokens = []) {
  await push(ref(db, "chats/" + chatId + "/messages"), {
    text,
    sender: "user",
    time: Date.now()
  });

  if (tokens.length) {
    try {
      await fetch("/api/sendNotification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens,
          title: "Nova mensagem",
          body: text,
          url: "/"
        })
      });
    } catch (e) {
      console.error("Erro ao enviar push:", e);
    }
  }
}