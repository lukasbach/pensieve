import { BrowserWindow, desktopCapturer } from "electron";

export const mainApi = {
  closeWindow: async () => {
    BrowserWindow.getFocusedWindow()?.close();
  },
  restoreMaximizeWindow: async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) {
      win.restore();
    } else {
      win?.maximize();
    }
  },

  minimizeWindow: async () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  },

  getSources: async () => {
    return desktopCapturer.getSources({ types: ["window"] });
  },
};
