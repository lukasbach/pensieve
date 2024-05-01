import electron from "electron";
import { openAppWindow } from "./windows";
import { ScreenshotArea } from "../../types";

let resolveFn: (area: ScreenshotArea) => void;
let abortFn: () => void;

export const requestScreenshot = async () => {
  const displays = electron.screen.getAllDisplays();
  const sources = await electron.desktopCapturer.getSources({
    types: ["screen"],
  });
  const windows = displays.map((display) =>
    openAppWindow(
      "/screenshot",
      { displayId: sources.find((s) => s.display_id === `${display.id}`)!.id },
      {
        ...display.bounds,
        enableLargerThanScreen: true,
        opacity: 0.8,
        hasShadow: false,
        skipTaskbar: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        movable: false,
      },
    ),
  );

  try {
    return await new Promise<ScreenshotArea>((res, rej) => {
      resolveFn = res;
      abortFn = rej;
    });
  } catch {
    return null;
  } finally {
    windows.forEach((win) => win.close());
  }
};

export const completeScreenshot = async (area: ScreenshotArea) => {
  resolveFn?.(area);
};
export const abortScreenshot = async () => {
  abortFn?.();
};
