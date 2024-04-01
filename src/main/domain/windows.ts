import { BrowserWindow } from "electron";
import path from "path";

export const openAppWindow = (
  hash: string,
  options?: Electron.BrowserWindowConstructorOptions,
) => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    frame: false,
    ...options,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hash}`);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash },
    );
  }
  return mainWindow;
};
