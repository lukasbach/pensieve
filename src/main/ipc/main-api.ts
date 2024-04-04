import { BrowserWindow, desktopCapturer } from "electron";
import { openAppWindow } from "../domain/windows";
import * as settings from "../domain/settings";

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

  openSettingsWindow: async () => {
    openAppWindow("/settings");
  },

  getSettings: settings.getSettings,
  saveSettings: settings.saveSettings,
  resetSettings: settings.reset,
};
