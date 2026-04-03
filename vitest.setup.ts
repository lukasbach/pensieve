import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: HTMLElement.prototype.scrollIntoView ?? (() => {}),
  configurable: true,
  writable: true,
});

Object.defineProperty(window, "ipcApi", {
  value: {
    isDev: false,
    main: { invoke: async () => undefined },
    models: { invoke: async () => undefined },
    history: { invoke: async () => undefined },
    recorderIpc: { invoke: async () => undefined },
    windows: { invoke: async () => undefined },
    onInvalidateUiKeys: () => () => {},
    onSetIsTray: () => () => {},
    window: { minimize: () => {} },
  },
  configurable: true,
  writable: true,
});
