import { RecordingData, RecordingMeta } from "../../types";
import * as history from "../domain/history";

export const historyApi = {
  saveRecording: async (recordingData: RecordingData) => {
    await history.saveRecording(recordingData);
  },

  getRecordings: async () => {
    console.log("!");
    return history.listRecordings();
  },

  updateRecordingMeta: async (
    folder: string,
    partial: Partial<RecordingMeta>,
  ) => {
    await history.updateRecording(folder, partial);
  },

  postProcessRecording: async (folder: string) => {
    await history.postProcessRecording(folder);
  },
};
