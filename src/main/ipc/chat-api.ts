import { chat } from "../domain/chat";

export const chatApi = {
  disposeSession: chat.disposeSession,
  listSessions: chat.listSessions,
  loadSession: chat.loadSession,
  resetSession: chat.resetSession,
  sendMessage: chat.sendMessage,
};
