import { BrowserWindow, Rectangle, screen } from "electron";
import path from "path";
import { getIconPath } from "../../main-utils";

enum MainWindowModeValue {
  Open,
  Tray,
  Minimized,
}

let mainWindow: BrowserWindow | null = null;
let mainWindowMode = MainWindowModeValue.Minimized as MainWindowModeValue;
let oldBounds: Rectangle;

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
  return win;
};

export const initializeMainWindow = () => {
  mainWindow = openAppWindow("/", { isMainWindow: "true", tray: "false" }, {});
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
  }
  mainWindow?.setSkipTaskbar(true);
  mainWindow?.hide();
  mainWindowMode = MainWindowModeValue.Minimized;
};

export const openMainWindowNormally = () => {
  mainWindow?.setBounds(oldBounds);
  mainWindow?.setSkipTaskbar(false);
  mainWindow?.removeAllListeners("blur");
  mainWindow?.webContents.send("setIsTray", false);
  mainWindow?.show();
  mainWindowMode = MainWindowModeValue.Open;
};

export const openMainWindowAsTray = () => {
  if (!mainWindow) return;

  if (mainWindowMode === MainWindowModeValue.Open) {
    oldBounds = mainWindow?.getBounds() as Rectangle;
  }

  const display = screen.getPrimaryDisplay();
  const width = 450;
  const height = 700;
  mainWindow.show();
  mainWindow.setBounds({
    x: display.bounds.width - width - 5,
    y: display.bounds.height - height - 55,
    width,
    height,
  });

  mainWindow.setSkipTaskbar(true);
  mainWindow.on("blur", hideMainWindow);
  mainWindow.webContents.send("setIsTray", true);
  mainWindowMode = MainWindowModeValue.Tray;
};
