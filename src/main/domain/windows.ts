import { BrowserWindow, Notification, Rectangle, screen } from "electron";
import path from "path";
import { getIconPath } from "../../main-utils";
import { getSettings, saveSettings } from "./settings";
import * as recorderIpc from "./recorder-ipc";

enum MainWindowModeValue {
  Open,
  Tray,
  Minimized,
}

let mainWindow: BrowserWindow | null = null;
let mainWindowMode = MainWindowModeValue.Minimized as MainWindowModeValue;
let oldBounds: Rectangle;
let recordingOverlay: BrowserWindow | null = null;

export const getMainWindow = () => mainWindow;

export const isMainWindowOpen = () =>
  mainWindowMode === MainWindowModeValue.Open;

export const openAppWindow = (
  hash: string,
  query?: Record<string, string>,
  options?: Electron.BrowserWindowConstructorOptions,
) => {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 600,
    frame: false,
    icon: getIconPath(),
    show: false,
    minWidth: 300,
    minHeight: 300,
    ...options,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const queryString = query
      ? Object.entries(query)
          .map(([key, value]) => `${key}=${value}`)
          .join("&")
      : "";
    win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hash}?${queryString}`);
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash, query },
    );
  }
  setTimeout(() => win.show(), 200);
  return win;
};

export const openRecorderOverlayWindow = async () => {
  if (!(await getSettings()).ui.useOverlayTool) {
    return;
  }

  const width = 360;

  if (recordingOverlay && !recordingOverlay.isDestroyed()) {
    recordingOverlay.show();
    return;
  }

  recordingOverlay = openAppWindow(
    `/recorder-overlay`,
    {},
    {
      width,
      height: 400,
      x: screen.getPrimaryDisplay().bounds.width - width - 20,
      y: 20,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      focusable: false,
      skipTaskbar: true,
    },
  );
  recordingOverlay?.setIgnoreMouseEvents(true, { forward: true });
};

export const closeRecorderOverlayWindow = async () => {
  recordingOverlay?.close();
  recordingOverlay = null;
};
export const isRecorderOverlayOpen = () => {
  return recordingOverlay !== null;
};

export const mouseEnterRecordingOverlay = async () => {
  recordingOverlay?.setIgnoreMouseEvents(false);
};
export const mouseLeaveRecordingOverlay = async () => {
  recordingOverlay?.setIgnoreMouseEvents(true, { forward: true });
};

export const initializeMainWindow = () => {
  mainWindow = openAppWindow(
    "/",
    { isMainWindow: "true", tray: "false" },
    { width: 500, height: 700 },
  );
  mainWindow.hide();

  mainWindow.on("blur", () => {
    if (mainWindowMode === MainWindowModeValue.Tray) {
      mainWindow?.hide();
      mainWindowMode = MainWindowModeValue.Minimized;
    }
  });
  return mainWindow;
};

export const hideMainWindow = () => {
  if (mainWindowMode === MainWindowModeValue.Open) {
    oldBounds = mainWindow?.getBounds() as Rectangle;

    (async () => {
      if (!(await getSettings()).ui.trayRunningNotificationShown) {
        new Notification({
          title: "Pensieve is still running",
          body: "Pensieve will continue running in the tray. You can close the app from there.",
        }).show();
        await saveSettings({ ui: { trayRunningNotificationShown: true } });
      }
    })();
  }
  mainWindow?.setSkipTaskbar(true);
  mainWindow?.hide();
  mainWindowMode = MainWindowModeValue.Minimized;

  if (recorderIpc.getState().isRecording) {
    openRecorderOverlayWindow();
  }
};

export const openMainWindowNormally = () => {
  mainWindow?.setBounds(oldBounds);
  mainWindow?.setSkipTaskbar(false);
  mainWindow?.setResizable(true);
  mainWindow?.setMaximizable(true);
  mainWindow?.setAlwaysOnTop(false);
  mainWindow?.setMovable(true);
  mainWindow?.setClosable(true);
  mainWindow?.removeAllListeners("blur");
  mainWindow?.webContents.send("setIsTray", false);
  mainWindow?.show();
  mainWindowMode = MainWindowModeValue.Open;

  if (recordingOverlay) {
    closeRecorderOverlayWindow();
  }
};

export const openMainWindowAsTray = () => {
  if (!mainWindow) return;

  if (mainWindowMode === MainWindowModeValue.Open) {
    oldBounds = mainWindow?.getBounds() as Rectangle;
  }

  const display = screen.getPrimaryDisplay();
  const width = 450;
  const height = 700;
  mainWindow.setBounds({
    x: display.bounds.width - width - 5,
    y: display.bounds.height - height - 55,
    width,
    height,
  });
  mainWindow.show();
  mainWindow.setResizable(false);
  mainWindow.setMaximizable(false);
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setMovable(false);
  mainWindow.setClosable(false);
  mainWindow.setSkipTaskbar(true);
  mainWindow.on("blur", hideMainWindow);
  mainWindow.webContents.send("setIsTray", true);
  mainWindowMode = MainWindowModeValue.Tray;
};

export const closeCurrentWindow = () => {
  const win = BrowserWindow.getFocusedWindow();

  if (!win) return;

  if (win.id === mainWindow?.id) {
    hideMainWindow();
    return;
  }

  win.close();
};
