import { Menu, Tray, app } from "electron";
import { getIconPath } from "../../main-utils";
import * as windows from "./windows";
import { windowsApi } from "../ipc/windows-api";

export const registerTray = () => {
  const tray = new Tray(getIconPath());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      type: "normal",
      click: () => windows.openMainWindowNormally(),
    },
    // { label: "Start recording", type: "normal", click: () => {} },
    {
      label: "Settings",
      type: "normal",
      click: () => windowsApi.openSettingsWindow(),
    },
    { 
      label: "Quit", 
      type: "normal", 
      click: () => {
        app.exit(0);
      }
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", windows.openMainWindowAsTray);
  tray.on("double-click", windows.openMainWindowNormally);
};
