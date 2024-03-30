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

  getRecordings: async () => {
    return appCore.listRecordings();
  },

  postProcessRecording: async (folder: string) => {
    await appCore.postProcessRecording(folder);
  },
};
