import { dialog } from "electron";
import fs from "fs-extra";
import * as history from "../domain/history";
import * as postprocess from "../domain/postprocess";
import * as searchIndex from "../domain/search";
import * as vectorSearch from "../domain/vector-search";
import { openAppWindow } from "../domain/windows";
import { PostProcessingJob } from "../../types";

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
  
  // Vector search functions
  vectorSearch: async (query: string, limit?: number, recordingId?: string) => 
    vectorSearch.vectorSearch(query, limit, recordingId),
  hybridSearch: async (query: string, limit?: number, recordingId?: string) => 
    vectorSearch.hybridSearch(query, limit, recordingId),
  initializeVectorStore: async () => vectorSearch.initializeVectorStore(),
  isVectorStoreAvailable: () => vectorSearch.isVectorStoreAvailable(),
  getVectorStoreStats: async () => vectorSearch.getVectorStoreStats(),
  
  // Debug/utility functions
  populateVectorStoreFromExistingTranscripts: async () => {
    const recordings = await history.listRecordings();
    let processed = 0;
    let errors = 0;
    
    for (const [recordingId, meta] of Object.entries(recordings)) {
      if (meta.isPostProcessed) {
        try {
          await vectorSearch.addTranscriptToVectorStore(recordingId);
          processed++;
        } catch (error) {
          console.error(`Failed to index recording ${recordingId}:`, error);
          errors++;
        }
      }
    }
    
    return { processed, errors, total: Object.keys(recordings).length };
  },

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
