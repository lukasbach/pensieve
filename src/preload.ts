import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcApi", {
  main: {
    invoke: (payload: any) => ipcRenderer.invoke("main", payload),
  },
  models: {
    invoke: (payload: any) => ipcRenderer.invoke("models", payload),
  },
});
