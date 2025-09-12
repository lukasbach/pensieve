// Set up IndexedDB polyfill for Node.js environment
import 'fake-indexeddb/auto';

import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import fs from "fs-extra";
import path from "path";
import log from "electron-log/main";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import * as history from "./history";
import { getEmbeddings } from "./llm";
import { RecordingTranscript, RecordingTranscriptItem } from "../../types";
import { getSettings } from "./settings";

interface VectorSearchResult {
  recordingId: string;
  chunkIndex: number;
  text: string;
  timestamp: string;
  speaker: string;
  score: number;
  startTime: number;
  endTime: number;
}

interface TranscriptChunk {
  id: string;
  recordingId: string;
  chunkIndex: number;
  text: string;
  timestamp: string;
  speaker: string;
  startTime: number;
  endTime: number;
  embedding: number[];
}

interface VectorIndex {
  id: string;
  chunkId: string;
  index: number;
  distance: number;
}

// Database collections
type Collections = {
  chunks: RxCollection<TranscriptChunk>;
  vectorIndex: RxCollection<VectorIndex>;
};

class VectorStore {
  private db: RxDatabase<Collections> | null = null;
  private embeddings: any = null;
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), "vector-store");
  }

  async initialize() {
    try {
      // Initialize the embedding model using existing LLM infrastructure
      log.info("Loading embedding model...");
      this.embeddings = await getEmbeddings();
      log.info("Embedding model loaded successfully");

      // Create RxDB database
      log.info("Creating RxDB database...");
      this.db = await createRxDatabase({
        name: 'vector-store',
        storage: getRxStorageDexie(),
        multiInstance: false,
      });
      log.info("RxDB database created successfully");

      // Add collections
      log.info("Adding collections to RxDB...");
      await this.db.addCollections({
        chunks: {
          schema: {
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
              id: { type: 'string', maxLength: 50 },
              recordingId: { type: 'string', maxLength: 50 },
              chunkIndex: { type: 'number' },
              text: { type: 'string' },
              timestamp: { type: 'string', maxLength: 20 },
              speaker: { type: 'string', maxLength: 20 },
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              embedding: { 
                type: 'array',
                items: { type: 'number' }
              }
            },
            required: ['id', 'recordingId', 'chunkIndex', 'text', 'timestamp', 'speaker', 'startTime', 'endTime', 'embedding']
          }
        },
        vectorIndex: {
          schema: {
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
              id: { type: 'string', maxLength: 50 },
              chunkId: { type: 'string', maxLength: 50 },
              index: { type: 'number' },
              distance: { type: 'number' }
            },
            required: ['id', 'chunkId', 'index', 'distance']
          }
        }
      });
      log.info("Collections added successfully");

      log.info("Vector store initialized successfully");
    } catch (error) {
      log.error("Failed to initialize vector store:", error);
      throw error;
    }
  }

  async addTranscript(recordingId: string) {
    try {
      if (!this.db || !this.embeddings) {
        log.warn("Vector store not initialized, skipping transcript indexing");
        return;
      }

      const transcript = await history.getRecordingTranscript(recordingId);
      if (!transcript) {
        log.warn(`No transcript found for recording: ${recordingId}`);
        return;
      }

      // Remove existing chunks for this recording
      await this.removeTranscript(recordingId);

      // Chunk the transcript
      const chunks = await this.chunkTranscript(transcript);
      log.info(`Created ${chunks.length} chunks for recording: ${recordingId}`);

      // Generate embeddings and add to database
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.embeddings.embedDocuments([chunk.pageContent]);
        
        // Debug: Log embedding dimension
        if (i === 0) {
          log.info(`Embedding dimension: ${embedding[0].length}`);
        }
        
        const chunkDoc: TranscriptChunk = {
          id: `${recordingId}-${i}`,
          recordingId,
          chunkIndex: i,
          text: chunk.pageContent,
          timestamp: chunk.metadata.timestamp,
          speaker: chunk.metadata.speaker,
          startTime: chunk.metadata.startTime,
          endTime: chunk.metadata.endTime,
          embedding: embedding[0]
        };

        await this.db.chunks.insert(chunkDoc);
        
        // TODO: Create vector index entries for faster searching
        // await this.createVectorIndex(chunkDoc);
      }

      log.info(`Added ${chunks.length} chunks to vector store for recording: ${recordingId}`);
    } catch (error) {
      log.error(`Failed to add transcript to vector store: ${error}`);
      throw error;
    }
  }

  async removeTranscript(recordingId: string) {
    try {
      if (!this.db) return;

      // Remove chunks
      const chunks = await this.db.chunks.find({
        selector: { recordingId }
      }).exec();

      for (const chunk of chunks) {
        // Remove vector index entries
        await this.db.vectorIndex.find({
          selector: { chunkId: chunk.id }
        }).remove();
        
        // Remove chunk
        await chunk.remove();
      }

      log.info(`Removed vector chunks for recording: ${recordingId}`);
    } catch (error) {
      log.error(`Failed to remove transcript from vector store: ${error}`);
    }
  }

  async search(query: string, limit: number = 10, recordingId?: string): Promise<VectorSearchResult[]> {
    try {
      if (!this.db || !this.embeddings) {
        log.warn("Vector store not available for search");
        return [];
      }

      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Build selector for recording filter
      const selector: any = {};
      if (recordingId) {
        selector.recordingId = recordingId;
      }

      // Get all chunks (in a real implementation, you'd use the vector index for better performance)
      const chunks = await this.db.chunks.find({ selector }).exec();
      
      // Calculate similarities
      const results = chunks.map(chunk => {
        const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          recordingId: chunk.recordingId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          timestamp: chunk.timestamp,
          speaker: chunk.speaker,
          score: similarity,
          startTime: chunk.startTime,
          endTime: chunk.endTime
        };
      });

      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      log.error("Vector search failed:", error);
      return [];
    }
  }

  async getStats() {
    try {
      if (!this.db) {
        return { totalChunks: 0, recordings: 0 };
      }

      const totalChunks = await this.db.chunks.count().exec();
      
      // Get unique recording count
      const chunks = await this.db.chunks.find({}).exec();
      const recordings = new Set(chunks.map(chunk => chunk.recordingId)).size;

      return { totalChunks, recordings };
    } catch (error) {
      log.error("Failed to get vector store stats:", error);
      return { totalChunks: 0, recordings: 0 };
    }
  }


  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async createVectorIndex(chunk: TranscriptChunk) {
    if (!this.db) return;

    // Create sample vectors for indexing (simplified approach)
    const sampleVectors = this.generateSampleVectors(chunk.embedding.length);
    
    for (let i = 0; i < sampleVectors.length; i++) {
      const distance = this.euclideanDistance(sampleVectors[i], chunk.embedding);
      
      const indexDoc: VectorIndex = {
        id: `${chunk.id}-${i}`,
        chunkId: chunk.id,
        index: i,
        distance: distance
      };

      await this.db.vectorIndex.insert(indexDoc);
    }
  }

  private generateSampleVectors(embeddingDimension: number): number[][] {
    // Generate 5 sample vectors for indexing
    // In a real implementation, you'd use a more sophisticated approach
    const vectors: number[][] = [];
    for (let i = 0; i < 5; i++) {
      const vector = new Array(embeddingDimension).fill(0).map(() => Math.random() - 0.5);
      vectors.push(vector);
    }
    return vectors;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private async chunkTranscript(transcript: RecordingTranscript): Promise<Document[]> {
    const settings = await getSettings();
    const chunkSize = settings.vectorSearch?.chunkSize || 1000;
    const chunkOverlap = settings.vectorSearch?.chunkOverlap || 200;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const documents = transcript.transcription.map((item: RecordingTranscriptItem) => {
      const speakerText = item.speaker === "0" ? "They" : item.speaker === "1" ? "Me" : "Participant";
      const timestamp = `[${Math.floor(item.offsets.from / 1000)}s]`;
      
      return new Document({
        pageContent: `${speakerText} ${timestamp}: ${item.text}`,
        metadata: {
          timestamp: timestamp,
          speaker: speakerText,
          startTime: item.offsets.from,
          endTime: item.offsets.to
        }
      });
    });

    return await splitter.splitDocuments(documents);
  }

  async shutdown() {
    try {
      if (this.db) {
        await this.db.destroy();
        log.info("Vector store database closed");
      }
    } catch (error) {
      log.error("Failed to shutdown vector store:", error);
    }
  }
}

// Singleton instance
const vectorStore = new VectorStore();

export const initializeVectorStore = async () => {
  try {
    await vectorStore.initialize();
    return true;
  } catch (error) {
    log.error("Failed to initialize vector store:", error);
    log.error("Error details:", JSON.stringify(error, null, 2));
    log.info("Vector search will be disabled. App will continue with text search only.");
    return false;
  }
};

export const addTranscriptToVectorStore = async (recordingId: string) => {
  await vectorStore.addTranscript(recordingId);
};

export const removeTranscriptFromVectorStore = async (recordingId: string) => {
  await vectorStore.removeTranscript(recordingId);
};

export const vectorSearch = async (
  query: string,
  limit: number = 10,
  recordingId?: string
): Promise<VectorSearchResult[]> => {
  return await vectorStore.search(query, limit, recordingId);
};

export const hybridSearch = async (
  query: string,
  limit: number = 10,
  recordingId?: string
): Promise<VectorSearchResult[]> => {
  // For now, hybrid search is the same as vector search
  // In the future, this could combine text search and vector search results
  return await vectorStore.search(query, limit, recordingId);
};

export const isVectorStoreAvailable = () => {
  return vectorStore !== null;
};

export const getVectorStoreStats = async () => {
  return await vectorStore.getStats();
};

export const shutdownVectorStore = async () => {
  await vectorStore.shutdown();
};
