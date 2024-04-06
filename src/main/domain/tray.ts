import { Menu, Tray, app } from "electron";
import { getIconPath } from "../../main-utils";
import { mainApi } from "../ipc/main-api";
import * as windows from "./windows";

export const registerTray = () => {
  const tray = new Tray(getIconPath());

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open", type: "normal", click: windows.openMainWindowNormally },
    // { label: "Start recording", type: "normal", click: () => {} },
    {
      label: "Settings",
      type: "normal",
      click: mainApi.openSettingsWindow,
    },
    { label: "Close", type: "normal", click: app.quit },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", windows.openMainWindowAsTray);
};
