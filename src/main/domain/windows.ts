import { BrowserWindow } from "electron";
import path from "path";
import { getIconPath } from "../../main-utils";

export const openAppWindow = (
  hash: string,
  query?: Record<string, string>,
  options?: Electron.BrowserWindowConstructorOptions,
) => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(
      `${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hash}?${queryString}`,
    );
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash, query },
    );
  }
  return mainWindow;
};
