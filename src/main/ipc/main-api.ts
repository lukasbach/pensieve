import { BrowserWindow, app, desktopCapturer, shell } from "electron";
import path from "path";
import * as windows from "../domain/windows";
import * as settings from "../domain/settings";
import { SettingsTab } from "../../renderer/settings/tabs";

const updateExe = path.resolve(
  path.dirname(process.execPath),
  "..",
  "Update.exe",
);
const exeName = path.basename(process.execPath);

export const mainApi = {
  closeCurrentWindow: async () => {
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

  openSettingsWindow: async (
    settingsTab: SettingsTab = SettingsTab.General,
  ) => {
    windows.openAppWindow(`/settings`, { settingsTab });
  },

  openMainWindowNormally: async () => {
    windows.openMainWindowNormally();
  },
  hideMainWindow: async () => {
    windows.hideMainWindow();
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
        "--autostart",
      ],
    });
  },

  openWeb: async (url: string) => {
    await shell.openExternal(url);
  },

  getSettings: settings.getSettings,
  saveSettings: settings.saveSettings,
  resetSettings: settings.reset,
};
