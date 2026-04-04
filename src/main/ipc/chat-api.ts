import { chat } from "../domain/chat";

export const chatApi = {
  disposeSession: chat.disposeSession,
  resetSession: chat.resetSession,
  sendMessage: chat.sendMessage,
};
