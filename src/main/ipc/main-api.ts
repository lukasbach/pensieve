import { BrowserWindow, app, desktopCapturer, shell } from "electron";
import path from "path";
import * as windows from "../domain/windows";
import * as settings from "../domain/settings";
import * as screenshot from "../domain/screenshot";
import { SettingsTab } from "../../renderer/settings/tabs";

const updateExe = path.resolve(
  path.dirname(process.execPath),
  "..",
  "Update.exe",
);
const exeName = path.basename(process.execPath);

export const mainApi = {
  getAppVersion: async () => process.env.npm_package_version,

  closeCurrentWindow: async () => {
    windows.closeCurrentWindow();
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
    windows.openAppWindow(
      `/settings`,
      { settingsTab },
      { minWidth: 650, minHeight: 400 },
    );
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
        '"--hidden --autostart"',
      ],
    });
  },

  openWeb: async (url: string) => {
    await shell.openExternal(url);
  },

  requestScreenshotArea: screenshot.requestScreenshot,
  completeScreenshotArea: screenshot.completeScreenshot,
  abortScreenshotArea: screenshot.abortScreenshot,

  getSettings: settings.getSettings,
  saveSettings: settings.saveSettings,
  resetSettings: settings.reset,
};
