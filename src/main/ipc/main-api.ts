import { app, desktopCapturer, shell } from "electron";
import path from "path";
import * as settings from "../domain/settings";
import * as screenshot from "../domain/screenshot";

const updateExe = path.resolve(
  path.dirname(process.execPath),
  "..",
  "Update.exe",
);
const exeName = path.basename(process.execPath);

export const mainApi = {
  getAppVersion: async () => app.getVersion(),

  getSources: async () => {
    return desktopCapturer.getSources({ types: ["window"] });
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
