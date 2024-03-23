import { desktopCapturer } from "electron";

export const mainApi = {
  getSources: async () => {
    return desktopCapturer.getSources({ types: ["window"] });
  },
};
