import { app, protocol } from "electron";
import path from "path";
import fs from "fs-extra";
import { updateElectronApp } from "update-electron-app";
import { loadIpcInterfaceInMain } from "./main/ipc/ipc-connector";
import { mainApi } from "./main/ipc/main-api";
import { modelsApi } from "./main/ipc/models-api";
import { historyApi } from "./main/ipc/history-api";
import * as history from "./main/domain/history";
import * as searchIndex from "./main/domain/search";
import * as settings from "./main/domain/settings";
import { registerTray } from "./main/domain/tray";
import * as windows from "./main/domain/windows";

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: "recording",
    privileges: {
      bypassCSP: true,
      // supportFetchAPI: true,
      // secure: true,
      stream: true,
    },
  },
]);

app.whenReady().then(async () => {
  await history.init();
  loadIpcInterfaceInMain("main", mainApi);
  loadIpcInterfaceInMain("history", historyApi);
  loadIpcInterfaceInMain("models", modelsApi);

  searchIndex.initializeSearchIndex().then(() => {
    console.log("Search index initialized.");
  });

  if (!settings.existsSettingsFile()) {
    await settings.initSettingsFile();
    await mainApi.setAutoStart(true);
  }

  // protocol.handle("recording" doesn't produce a seekable stream
  protocol.registerFileProtocol("recording", async (request, callback) => {
    const recordingId = request.url.replace("recording://", "");
    const mp3 = path.join(
      history.getRecordingsFolder(),
      recordingId,
      "recording.mp3",
    );
    if (fs.existsSync(mp3)) {
      callback({ path: mp3 });
    } else {
      callback({ statusCode: 404 });
    }
  });

  windows.initializeMainWindow();
  if (!process.argv.includes("--autostart")) {
    windows.openMainWindowNormally();
  } else {
    windows.hideMainWindow();
  }
  await registerTray();
});
