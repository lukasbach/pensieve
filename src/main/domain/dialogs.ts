import { BrowserWindow } from "electron";
import * as windows from "./windows";
import { DialogData } from "../../renderer/dialog/context";

const dialogs: Record<
  string,
  {
    data: DialogData<any>;
    value?: any;
    win: BrowserWindow;
    resolve: (value: any) => void;
    close: () => void;
  }
> = {};

export const createDialog = <T>(id: string, dialog: DialogData<T>) => {
  const win = windows.openAppWindow(
    "/dialog",
    { dialogId: id },
    { width: 560, height: 160, minWidth: 320, minHeight: 160 },
  );

  return new Promise<T | null>((r) => {
    dialogs[id] = {
      data: dialog,
      win,
      resolve: (value) => r(value),
      close: () => r(null),
    };
  });
};

export const submitDialogData = (id: string, value: any) => {
  // dialogs[id].data.onSubmit?.(value);
  console.log("submitDialogData: ", value);
  dialogs[id].resolve(value);
  dialogs[id].value = value;
  dialogs[id].win.close();
  delete dialogs[id];
};

export const closeDialog = (id: string) => {
  dialogs[id].close();
  dialogs[id].win.close();
  delete dialogs[id];
};

export const getDialogData = (id: string) => dialogs[id].data;
export const getDialogValue = (id: string) => dialogs[id]?.value;
export const getDialogWindow = (id: string) => dialogs[id]?.win;
