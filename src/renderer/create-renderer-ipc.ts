import { IpcInterface } from "../main/ipc/ipc-connector";

export const createRendererIpc = <T extends IpcInterface>(
  channel: string,
): T => {
  return new Proxy(
    {},
    {
      get: (target, prop: string) => {
        return (...args: any[]) => {
          return (window as any).ipcApi[channel].invoke({
            eventName: prop,
            args,
          });
        };
      },
    },
  ) as T;
};
