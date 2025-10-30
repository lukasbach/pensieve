import { dialog } from "electron";
import fs from "fs-extra";
import * as history from "../domain/history";
import * as postprocess from "../domain/postprocess";
import * as searchIndex from "../domain/search";
import * as vectorSearch from "../domain/vector-search";
import { openAppWindow } from "../domain/windows";
import { PostProcessingJob, VectorSearchResult } from "../../types";
import { getChatModel, getEmbeddings } from "../domain/llm";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

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
  isVectorStoreAvailable: async () => vectorSearch.isVectorStoreAvailable(),
  getVectorStoreStats: async () => vectorSearch.getVectorStoreStats(),
  
  // Conversational chat functions
  generateConversationalResponse: async (query: string, searchResults: VectorSearchResult[]) => {
    try {
      const chatModel = await getChatModel();
      
      // Create a conversational prompt
      const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant that answers questions based on meeting transcripts. 
Use the provided context to give a natural, conversational response to the user's question.

Context from transcripts:
{context}

User question: {input}

Please provide a helpful, conversational response based on the context above. If the context doesn't contain enough information to answer the question, say so politely.
`);

      // Create the chain
      const chain = await createStuffDocumentsChain({
        llm: chatModel,
        prompt,
      });

      // Convert search results to documents
      const documents = searchResults.map(result => new Document({
        pageContent: result.text,
        metadata: {
          recordingId: result.recordingId,
          timestamp: result.timestamp,
          speaker: result.speaker,
          score: result.score
        }
      }));

      // Generate response
      const response = await chain.invoke({
        input: query,
        context: documents,
      });

      return response;
    } catch (error) {
      console.error("Failed to generate conversational response:", error);
      return "I'm sorry, I couldn't generate a proper response. Please try again.";
    }
  },
  
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
