import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcApi", {
  main: {
    invoke: (payload: any) => ipcRenderer.invoke("main", payload),
  },
  models: {
    invoke: (payload: any) => ipcRenderer.invoke("models", payload),
  },
  history: {
    invoke: (payload: any) => ipcRenderer.invoke("history", payload),
  },
  onInvalidateUiKeys: (listener: (keys: string[]) => void) => {
    ipcRenderer.on("invalidate", (_event, keys) => {
      listener(keys);
    });
  },
  window: {
    minimize: () => {},
  },
});
