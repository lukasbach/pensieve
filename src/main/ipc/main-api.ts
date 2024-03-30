import { desktopCapturer } from "electron";
import { RecordingData } from "../../types";
import { appCore } from "../../main";

export const mainApi = {
  getSources: async () => {
    return desktopCapturer.getSources({ types: ["window"] });
  },

  saveRecording: async (recordingData: RecordingData) => {
    await appCore.saveRecording(recordingData);
  },
};
