import { app, protocol } from "electron";
import path from "path";
import fs from "fs-extra";
import { updateElectronApp } from "update-electron-app";
import log from "electron-log/main";
import started from "electron-squirrel-startup";
import http from "http";
import getPort from "get-port";
import { loadIpcInterfaceInMain } from "./main/ipc/ipc-connector";
import { mainApi } from "./main/ipc/main-api";
import { modelsApi } from "./main/ipc/models-api";
import { historyApi } from "./main/ipc/history-api";
import * as history from "./main/domain/history";
import * as searchIndex from "./main/domain/search";
import * as settings from "./main/domain/settings";
import * as vectorSearch from "./main/domain/vector-search";
import { registerTray } from "./main/domain/tray";
import * as windows from "./main/domain/windows";
import { windowsApi } from "./main/ipc/windows-api";
import { recorderIpcApi } from "./main/ipc/recorder-ipc";
import {
  getAudioServerSecret,
  setAudioServerPort,
} from "./main/domain/audio-server";

log.initialize({ spyRendererConsole: true });

updateElectronApp();

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const mainWindow = windows.getMainWindow();
    if (!mainWindow) {
      return;
    }
    if (!windows.isMainWindowOpen()) {
      windows.openMainWindowNormally();
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (started) {
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
  loadIpcInterfaceInMain("windows", windowsApi);
  loadIpcInterfaceInMain("history", historyApi);
  loadIpcInterfaceInMain("models", modelsApi);
  loadIpcInterfaceInMain("recorderIpc", recorderIpcApi);

  searchIndex.initializeSearchIndex().then(() => {
    log.info("Search index initialized.");
  });

  // Initialize vector store for semantic search
  vectorSearch.initializeVectorStore().then((success) => {
    if (success) {
      log.info("Vector store initialized successfully.");
    } else {
      log.info("Vector store initialization failed or disabled.");
    }
  });

  if (!settings.existsSettingsFile()) {
    await settings.initSettingsFile();
    await mainApi.setAutoStart(true);
  }

  // Start a local HTTP server for audio files
  const audioServer = http.createServer(async (req, res) => {
    if (req.url?.startsWith("/audio/")) {
      // Check for auth secret in query parameters
      const url = new URL(req.url, `http://localhost`);
      const providedSecret = url.searchParams.get("auth");
      const expectedSecret = getAudioServerSecret();

      if (
        !providedSecret ||
        !expectedSecret ||
        providedSecret !== expectedSecret
      ) {
        res.writeHead(401);
        res.end("Unauthorized");
        return;
      }

      const recordingId = url.pathname.replace("/audio/", "");
      const mp3 = path.join(
        await history.getRecordingsFolder(),
        recordingId,
        "recording.mp3",
      );

      if (!fs.existsSync(mp3)) {
        res.writeHead(404);
        res.end("Audio not found");
        return;
      }

      const stat = fs.statSync(mp3);
      const fileSize = stat.size;
      const { range } = req.headers;

      console.log(`Audio request: ${req.url}, Range: ${range || "none"}`);

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        console.log(`Range request: ${start}-${end} (${chunksize} bytes)`);

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "audio/mpeg",
        });

        const stream = fs.createReadStream(mp3, { start, end });
        stream.pipe(res);
      } else {
        console.log(`Full file request: ${fileSize} bytes`);
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
        });

        const stream = fs.createReadStream(mp3);
        stream.pipe(res);
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  // Start the audio server on a dynamic port
  const audioPort = await getPort({ port: 3001 });
  setAudioServerPort(audioPort);
  audioServer.listen(audioPort, () => {
    console.log(`Audio server running on port ${audioPort}`);
  });

  // Keep the original protocol for backward compatibility
  protocol.registerFileProtocol("recording", async (request, callback) => {
    const recordingId = request.url.replace("recording://", "");
    const mp3 = path.join(
      await history.getRecordingsFolder(),
      recordingId,
      "recording.mp3",
    );
    if (fs.existsSync(mp3)) {
      callback({ path: mp3 });
    } else {
      console.error(`Recording audio not found: ${mp3}`);
      callback({ statusCode: 404 });
    }
  });

  protocol.registerFileProtocol("screenshot", async (request, callback) => {
    const fileName = request.url.replace("screenshot://", "");

    if (!/^[\w-_]+\/[\w]+\.png$/.test(fileName)) {
      console.error(`Invalid image loaded: ${fileName}`);
      callback({ statusCode: 400 });
      return;
    }

    const imageFile = path.join(await history.getRecordingsFolder(), fileName);
    if (fs.existsSync(imageFile)) {
      callback({ path: imageFile });
    } else {
      console.error(`Image not found: ${fileName}`);
      callback({ statusCode: 404 });
    }
  });

  windows.initializeMainWindow();

  const hidden = process.argv.join(" ").includes("hidden");
  log.info(
    `App ready, running ${hidden ? "hidden" : "normally"}. Args: ${process.argv.join(" ")}`,
  );
  if (!hidden) {
    windows.openMainWindowNormally();
  } else {
    // windows.hideMainWindow();
  }
  registerTray();
});
