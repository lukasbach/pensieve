import { BrowserWindow } from "electron";

export const invalidateUiKeys = (...keys: string[]) => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("invalidate", keys);
    console.log("invalidate keys", ...keys);
  }
};
