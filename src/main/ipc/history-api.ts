import * as history from "../domain/history";
import * as postprocess from "../domain/postprocess";
import { openAppWindow } from "../domain/windows";

export const historyApi = {
  saveRecording: history.saveRecording,
  getRecordings: history.listRecordings,
  updateRecordingMeta: history.updateRecording,
  getRecordingMeta: history.getRecordingMeta,
  getRecordingTranscript: history.getRecordingTranscript,
  getRecordingAudioFile: history.getRecordingAudioFile,

  startPostProcessing: postprocess.startQueue,
  stopPostProcessing: postprocess.stop,
  addToPostProcessingQueue: postprocess.addToQueue,
  getPostProcessingProgress: postprocess.getProgressData,

  openRecordingDetailsWindow: async (id: string) => {
    openAppWindow(`/history/${id}`);
  },
};
