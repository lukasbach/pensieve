import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcApi", {
  ipc: {
    invoke: (payload: any) => ipcRenderer.invoke("ipc", payload),
  },
});
