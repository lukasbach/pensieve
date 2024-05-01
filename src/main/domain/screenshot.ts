import electron from "electron";
import { openAppWindow } from "./windows";
import { ScreenshotArea } from "../../types";

let resolveFn: (area: ScreenshotArea) => void;
let abortFn: () => void;

const getBounds = async () => {
  const displays = electron.screen.getAllDisplays();
  const topLeft = displays.reduce(
    (acc, display) => {
      if (display.bounds.x < acc.x) {
        acc.x = display.bounds.x;
      }
      if (display.bounds.y < acc.y) {
        acc.y = display.bounds.y;
      }
      return acc;
    },
    { x: Infinity, y: Infinity },
  );
  const bottomRight = displays.reduce(
    (acc, display) => {
      if (display.bounds.x + display.bounds.width > acc.x) {
        acc.x = display.bounds.x + display.bounds.width;
      }
      if (display.bounds.y + display.bounds.height > acc.y) {
        acc.y = display.bounds.y + display.bounds.height;
      }
      return acc;
    },
    { x: -Infinity, y: -Infinity },
  );
  console.log("bounds", {
    displays: displays.map((d) => d.bounds),
    topLeft,
    bottomRight,
  });
  return { topLeft, bottomRight };
};

export const requestScreenshot = async () => {
  const { topLeft, bottomRight } = await getBounds();
  const win = openAppWindow(
    "/screenshot",
    {},
    {
      x: topLeft.x,
      y: topLeft.y,
      width: 1,
      height: 1,
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
  );
  win.setSize(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

  try {
    const area = await new Promise<ScreenshotArea>((res, rej) => {
      resolveFn = res;
      abortFn = rej;
    });
    console.log({ topLeft, area });
    return {
      x: area.x - topLeft.x,
      y: area.y - topLeft.y,
      width: area.width,
      height: area.height,
    };
  } catch {
    return null;
  } finally {
    win.close();
  }
};

export const completeScreenshot = async (area: ScreenshotArea) => {
  resolveFn?.(area);
};
export const abortScreenshot = async () => {
  abortFn?.();
};
