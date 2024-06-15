import { BrowserWindow } from "electron";
import log from "electron-log/main";

export const invalidateUiKeys = (...keys: string[]) => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("invalidate", keys);
    log.info("invalidate keys", ...keys);
  }
};
