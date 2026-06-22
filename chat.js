import { ref, push } from "firebase/database";
import { db } from "./firebase";

export function sendMessage(chatId, text) {
  push(ref(db, "chats/" + chatId + "/messages"), {
    text,
    sender: "user",
    time: Date.now()
  });
}
