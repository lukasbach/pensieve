import { BrowserWindow, app, desktopCapturer } from "electron";
import path from "path";
import { openAppWindow } from "../domain/windows";
import * as settings from "../domain/settings";

const updateExe = path.resolve(
  path.dirname(process.execPath),
  "..",
  "Update.exe",
);
const exeName = path.basename(process.execPath);

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

  setAutoStart: async (value: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: value,
      path: updateExe,
      args: [
        "--processStart",
        `"${exeName}"`,
        "--process-start-args",
        '"--hidden"',
      ],
    });
  },

  getSettings: settings.getSettings,
  saveSettings: settings.saveSettings,
  resetSettings: settings.reset,
};
