declare module "*.module.css";

declare global {
  interface Window {
    ipcApi: {
      isDev: boolean;
      main: {
        invoke: (payload: any) => Promise<any>;
      };
      models: {
        invoke: (payload: any) => Promise<any>;
      };
      history: {
        invoke: (payload: any) => Promise<any>;
      };
      onInvalidateUiKeys: (listener: (keys: string[]) => void) => () => void;
      onSetIsTray: (listener: (isTray: boolean) => void) => () => void;
      window: {
        minimize: () => void;
      };
    };
  }
}
