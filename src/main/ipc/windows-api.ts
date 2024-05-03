import { BrowserWindow } from "electron";
import * as windows from "../domain/windows";
import * as dialogs from "../domain/dialogs";
import { SettingsTab } from "../../renderer/settings/tabs";
import { DialogData } from "../../renderer/dialog/context";

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

  getDialogData: async (id: string) => {
    return dialogs.getDialogData(id);
  },
  openDialog: async (id: string, data: DialogData<any>) => {
    return dialogs.createDialog(id, data);
  },
  submitDialogData: async (id: string, value: any) => {
    dialogs.submitDialogData(id, value);
  },
  closeDialog: async (id: string) => {
    dialogs.closeDialog(id);
  },
};
