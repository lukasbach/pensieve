import { createRendererIpc } from "./create-renderer-ipc";
import type { mainApi as mainApiBackend } from "../main/ipc/main-api";

export const mainApi = createRendererIpc<typeof mainApiBackend>("ipc");
