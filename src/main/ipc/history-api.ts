import { dialog } from "electron";
import fs from "fs-extra";
import * as history from "../domain/history";
import * as postprocess from "../domain/postprocess";
import * as searchIndex from "../domain/search";
import { openAppWindow } from "../domain/windows";

export const historyApi = {
  storeUnassociatedScreenshot: history.storeUnassociatedScreenshot,
  saveRecording: history.saveRecording,
  importRecording: history.importRecording,
  getRecordings: history.listRecordings,
  updateRecordingMeta: history.updateRecording,
  getRecordingMeta: history.getRecordingMeta,
  getRecordingTranscript: history.getRecordingTranscript,
  getRecordingAudioFile: history.getRecordingAudioFile,
  openRecordingFolder: history.openRecordingFolder,
  removeRecording: history.removeRecording,

  search: async (query: string) => searchIndex.search(query),

  startPostProcessing: async () => postprocess.startQueue(),
  stopPostProcessing: async () => postprocess.stop(),
  addToPostProcessingQueue: async (modelId: string) =>
    postprocess.addToQueue(modelId),
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
