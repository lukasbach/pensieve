import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcApi", {
  isDev: process.env.NODE_ENV === "development",
  main: {
    invoke: (payload: any) => ipcRenderer.invoke("main", payload),
  },
  windows: {
    invoke: (payload: any) => ipcRenderer.invoke("windows", payload),
  },
  models: {
    invoke: (payload: any) => ipcRenderer.invoke("models", payload),
  },
  history: {
    invoke: (payload: any) => ipcRenderer.invoke("history", payload),
  },
  recorderIpc: {
    invoke: (payload: any) => ipcRenderer.invoke("recorderIpc", payload),
    onEvent: (type: string, listener: (...args: any[]) => void) => {
      const handler = (_: unknown, event: { type: string; args: any[] }) => {
        if (event.type === type) {
          listener(...event.args);
        }
      };
      ipcRenderer.on("recorderIpcEvent", handler);
      return () => {
        ipcRenderer.off("recorderIpcEvent", handler);
      };
    },
  },
  onInvalidateUiKeys: (listener: (keys: string[]) => void) => {
    const handler = (_: unknown, keys: string[]) => {
      listener(keys);
    };
    ipcRenderer.on("invalidate", handler);
    return () => {
      ipcRenderer.off("invalidate", handler);
    };
  },
  onSetIsTray: (listener: (isTray: boolean) => void) => {
    const handler = (_: unknown, isTray: boolean) => {
      listener(isTray);
    };
    ipcRenderer.on("setIsTray", handler);
    return () => {
      ipcRenderer.off("setIsTray", handler);
    };
  },
  window: {
    minimize: () => {},
  },
});
