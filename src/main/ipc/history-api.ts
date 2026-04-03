import { dialog } from "electron";
import fs from "fs-extra";
import * as history from "../domain/history";
import * as postprocess from "../domain/postprocess";
import * as searchIndex from "../domain/search";
import * as settings from "../domain/settings";
import { openAppWindow } from "../domain/windows";
import { PostProcessingJob } from "../../types";

const maybeAutoProcess = async (recordingId: string) => {
  if (!(await settings.getSettings()).ffmpeg.autoTriggerPostProcess) {
    return;
  }

  postprocess.addToQueue({ recordingId });
  postprocess.startQueue();
};

export const historyApi = {
  storeUnassociatedScreenshot: history.storeUnassociatedScreenshot,
  saveRecording: async (...args: Parameters<typeof history.saveRecording>) => {
    const recordingId = await history.saveRecording(...args);
    await maybeAutoProcess(recordingId);
  },
  importRecording: async (
    ...args: Parameters<typeof history.importRecording>
  ) => {
    const recordingId = await history.importRecording(...args);
    await maybeAutoProcess(recordingId);
  },
  getRecordings: history.listRecordings,
  updateRecordingMeta: history.updateRecording,
  getRecordingMeta: history.getRecordingMeta,
  getRecordingTranscript: history.getRecordingTranscript,
  getRecordingAudioFile: history.getRecordingAudioFile,
  openRecordingFolder: history.openRecordingFolder,
  removeRecording: history.removeRecording,

  search: searchIndex.search,

  startPostProcessing: async () => postprocess.startQueue(),
  stopPostProcessing: async () => postprocess.stop(),
  addToPostProcessingQueue: async (job: PostProcessingJob) =>
    postprocess.addToQueue(job),
  getPostProcessingProgress: async () => postprocess.getProgressData(),
  clearPostProcessingQueue: async () => postprocess.clearList(),

  openRecordingDetailsWindow: async (id: string) => {
    openAppWindow(`/history/${id}`, {}, { minWidth: 400, minHeight: 400 });
  },

  showOpenImportDialog: async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Import Recording",
      buttonLabel: "Import",
      properties: ["openFile"],
    });
    if (canceled || !filePaths[0]) {
      return null;
    }
    const fileCreationDate = fs.statSync(filePaths[0]).birthtime;
    return { filePath: filePaths[0], fileCreationDate };
  },
};
