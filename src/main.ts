import { BrowserWindow, app, protocol } from "electron";
import path from "path";
import fs from "fs-extra";
import { loadIpcInterfaceInMain } from "./main/ipc/ipc-connector";
import { mainApi } from "./main/ipc/main-api";
import { modelsApi } from "./main/ipc/models-api";
import { historyApi } from "./main/ipc/history-api";
import * as history from "./main/domain/history";
import { openAppWindow } from "./main/domain/windows";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = openAppWindow("/");
  mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
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
});
