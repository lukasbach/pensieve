import { Menu, Tray, screen } from "electron";
import { getIconPath } from "../../main-utils";
import { mainApi } from "../ipc/main-api";
import { openAppWindow } from "./windows";

export const registerTray = () => {
  const tray = new Tray(getIconPath());

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open", type: "normal", click: () => {} },
    { label: "Start recording", type: "normal", click: () => {} },
    {
      label: "Settings",
      type: "normal",
      click: () => mainApi.openSettingsWindow(),
    },
    { label: "Close", type: "normal", click: () => {} },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    const display = screen.getPrimaryDisplay();
    const width = 450;
    const height = 700;
    const mainWindow = openAppWindow(
      "/",
      { tray: "true" },
      {
        skipTaskbar: true,
        x: display.bounds.width - width - 5,
        y: display.bounds.height - height - 55,
        width,
        height,
      },
    );

    mainWindow.on("blur", () => {
      mainWindow.close();
    });
  });
};
