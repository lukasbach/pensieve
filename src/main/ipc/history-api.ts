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

  startPostProcessing: async () => postprocess.startQueue(),
  stopPostProcessing: async () => postprocess.stop(),
  addToPostProcessingQueue: async (modelId: string) =>
    postprocess.addToQueue(modelId),
  getPostProcessingProgress: async () => postprocess.getProgressData(),

  openRecordingDetailsWindow: async (id: string) => {
    openAppWindow(`/history/${id}`);
  },
};
