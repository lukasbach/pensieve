declare module "*.module.css";

declare global {
  interface Window {
    ipcApi: {
      isDev: boolean;
      main: {
        invoke: (payload: any) => Promise<any>;
      };
      windows: {
        invoke: (payload: any) => Promise<any>;
      };
      models: {
        invoke: (payload: any) => Promise<any>;
      };
      history: {
        invoke: (payload: any) => Promise<any>;
      };
      mcp: {
        invoke: (payload: any) => Promise<any>;
      };
      chat: {
        invoke: (payload: any) => Promise<any>;
      };
      recorderIpc: {
        invoke: (payload: any) => Promise<any>;
        onEvent: (
          type: string,
          listener: (...args: any[]) => void,
        ) => () => void;
      };
      onInvalidateUiKeys: (listener: (keys: string[]) => void) => () => void;
      onSetIsTray: (listener: (isTray: boolean) => void) => () => void;
      window: {
        minimize: () => void;
      };
    };
  }
}
