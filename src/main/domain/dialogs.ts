import { BrowserWindow, dialog } from "electron";
import log from "electron-log/main";
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
  const dialogWindowOptions =
    dialog.input?.type === "tags"
      ? { width: 560, height: 260, minWidth: 360, minHeight: 240 }
      : { width: 560, height: 160, minWidth: 320, minHeight: 160 };
  const win = windows.openAppWindow(
    "/dialog",
    { dialogId: id },
    dialogWindowOptions,
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
  log.info("submitDialogData: ", value);
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

export const confirmDialog = async (
  title: string,
  content: string,
  okayLabel = "Yes",
  cancelLabel = "No",
) => {
  const options = {
    type: "question" as const,
    buttons: [cancelLabel, okayLabel],
    cancelId: 0,
    defaultId: 1,
    noLink: true,
    title,
    message: title,
    detail: content,
  };
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const response = focusedWindow
    ? await dialog.showMessageBox(focusedWindow, options)
    : await dialog.showMessageBox(options);

  return response.response === 1;
};
