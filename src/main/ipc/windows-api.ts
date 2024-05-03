import { BrowserWindow } from "electron";
import * as windows from "../domain/windows";
import { SettingsTab } from "../../renderer/settings/tabs";

export const windowsApi = {
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
};
