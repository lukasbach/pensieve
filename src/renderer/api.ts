import { createRendererIpc } from "./create-renderer-ipc";
import type { mainApi as mainApiBackend } from "../main/ipc/main-api";
import type { windowsApi as windowsApiBackend } from "../main/ipc/windows-api";
import type { modelsApi as modelsApiBackend } from "../main/ipc/models-api";
import type { historyApi as historyApiBackend } from "../main/ipc/history-api";
import type { recorderIpcApi as recorderIpcApiBackend } from "../main/ipc/recorder-ipc";
import type { mcpApi as mcpApiBackend } from "../main/ipc/mcp-api";
import type { chatApi as chatApiBackend } from "../main/ipc/chat-api";

export const mainApi = createRendererIpc<typeof mainApiBackend>("main");
export const windowsApi =
  createRendererIpc<typeof windowsApiBackend>("windows");
export const modelsApi = createRendererIpc<typeof modelsApiBackend>("models");
export const historyApi =
  createRendererIpc<typeof historyApiBackend>("history");
export const recorderIpcApi =
  createRendererIpc<typeof recorderIpcApiBackend>("recorderIpc");
export const mcpApi = createRendererIpc<typeof mcpApiBackend>("mcp");
export const chatApi = createRendererIpc<typeof chatApiBackend>("chat");
