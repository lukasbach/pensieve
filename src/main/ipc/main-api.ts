import { app, desktopCapturer, shell } from "electron";
import path from "path";
import * as settings from "../domain/settings";
import * as screenshot from "../domain/screenshot";
import { getAudioServerPort } from "../domain/audio-server";

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

  getAudioPort: async () => {
    return getAudioServerPort();
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

  openLogFiles: async () => {
    const folder = path.join(app.getPath("userData"), "logs");
    await shell.openPath(folder);
  },

  openModelsFolder: async () => {
    const folder = path.join(app.getPath("userData"), "models");
    await shell.openPath(folder);
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
