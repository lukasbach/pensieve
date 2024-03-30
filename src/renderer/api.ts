import { createRendererIpc } from "./create-renderer-ipc";
import type { mainApi as mainApiBackend } from "../main/ipc/main-api";
import type { modelsApi as modelsApiBackend } from "../main/ipc/models-api";

export const mainApi = createRendererIpc<typeof mainApiBackend>("main");
export const modelsApi = createRendererIpc<typeof modelsApiBackend>("models");
