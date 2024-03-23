import { ipcMain } from "electron";

export type IpcInterface = Record<string, (...a: any[]) => Promise<any>>;

export const loadIpcInterfaceInMain = (channel: string, ipc: IpcInterface) => {
  ipcMain.handle(channel, (invokeEvent, { eventName, args }) => {
    return ipc[eventName](...args);
  });
};
