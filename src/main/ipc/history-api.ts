import * as history from "../domain/history";
import { openAppWindow } from "../domain/windows";

export const historyApi = {
  saveRecording: history.saveRecording,
  getRecordings: history.listRecordings,
  updateRecordingMeta: history.updateRecording,
  postProcessRecording: history.postProcessRecording,
  getRecordingMeta: history.getRecordingMeta,
  getRecordingTranscript: history.getRecordingTranscript,

  openRecordingDetailsWindow: async (id: string) => {
    openAppWindow(`/history/${id}`);
  },
};
