import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs-extra";
import log from "electron-log/main";
import { app } from "electron";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import * as history from "./history";
import { getEmbeddings } from "./llm";
import { RecordingTranscript, RecordingTranscriptItem, VectorSearchResult } from "../../types";
import { getSettings } from "./settings";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";

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

class SQLiteVectorStore {
  private db: sqlite3.Database | null = null;
  private embeddings: any = null;
  private dbPath: string;

  constructor() {
    // Use user data directory for packaged app, fallback to cwd for development
    const dataDir = app.isPackaged 
      ? app.getPath('userData')
      : process.cwd();
    this.dbPath = path.join(dataDir, "vector-store", "vector-store.db");
  }

  async initialize() {
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(this.dbPath));

      // Initialize the embedding model
      log.info("Loading embedding model...");
      this.embeddings = await getEmbeddings();
      log.info("Embedding model loaded successfully");

      // Open SQLite database
      log.info("Opening SQLite database...");
      this.db = new sqlite3.Database(this.dbPath);

      // Create tables
      await this.createTables();
      
      log.info("SQLite vector store initialized successfully");
    } catch (error) {
      log.error("Failed to initialize SQLite vector store:", error);
      throw error;
    }
  }


  private async createTables() {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      
      this.db.serialize(() => {
        const db = this.db!; // Safe to use ! here since we checked above
        // Create chunks table
        db.run(`
          CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            recording_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            speaker TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            embedding BLOB NOT NULL
          )
        `, (err) => {
          if (err) {
            log.error("Failed to create chunks table:", err);
            reject(err);
            return;
          }
        });

        // Create FTS5 virtual table for text search
        db.run(`
          CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
            text,
            speaker,
            timestamp,
            content='chunks',
            content_rowid='rowid'
          )
        `, (err) => {
          if (err) {
            log.error("Failed to create FTS5 table:", err);
            reject(err);
            return;
          }
        });

        // Create triggers to keep FTS5 in sync
        db.run(`
          CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
            INSERT INTO chunks_fts(rowid, text, speaker, timestamp)
            VALUES (new.rowid, new.text, new.speaker, new.timestamp);
          END
        `, (err) => {
          if (err) {
            log.error("Failed to create insert trigger:", err);
            reject(err);
            return;
          }
        });

        db.run(`
          CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, text, speaker, timestamp)
            VALUES('delete', old.rowid, old.text, old.speaker, old.timestamp);
          END
        `, (err) => {
          if (err) {
            log.error("Failed to create delete trigger:", err);
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  async addTranscript(recordingId: string, onProgress?: (progress: number) => void) {
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

        await this.insertChunk(chunkDoc);
        
        // Report progress
        if (onProgress) {
          const progressPercent = Math.round(((i + 1) / chunks.length) * 100);
          onProgress(progressPercent);
        }
      }

      log.info(`Added ${chunks.length} chunks to vector store for recording: ${recordingId}`);
    } catch (error) {
      log.error(`Failed to add transcript to vector store: ${error}`);
      throw error;
    }
  }

  private async insertChunk(chunk: TranscriptChunk) {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      
      const stmt = this.db.prepare(`
        INSERT INTO chunks (id, recording_id, chunk_index, text, timestamp, speaker, start_time, end_time, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        chunk.id,
        chunk.recordingId,
        chunk.chunkIndex,
        chunk.text,
        chunk.timestamp,
        chunk.speaker,
        chunk.startTime,
        chunk.endTime,
        JSON.stringify(chunk.embedding)
      ], (err) => {
        if (err) {
          log.error("Failed to insert chunk:", err);
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }

  async removeTranscript(recordingId: string) {
    try {
      if (!this.db) return;

      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        
        this.db.run(
          "DELETE FROM chunks WHERE recording_id = ?",
          [recordingId],
          function(err) {
            if (err) {
              log.error("Failed to remove transcript:", err);
              reject(err);
            } else {
              log.info(`Removed ${this.changes} chunks for recording: ${recordingId}`);
              resolve();
            }
          }
        );
      });
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

      // Build SQL query
      let sql = `
        SELECT id, recording_id, chunk_index, text, timestamp, speaker, start_time, end_time, embedding
        FROM chunks
      `;
      const params: any[] = [];

      if (recordingId) {
        sql += " WHERE recording_id = ?";
        params.push(recordingId);
      }

      return new Promise<VectorSearchResult[]>((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        
        this.db.all(sql, params, (err, rows: any[]) => {
          if (err) {
            log.error("Vector search failed:", err);
            reject(err);
            return;
          }

          // Calculate similarities
          const results = rows.map(row => {
            const embedding = JSON.parse(row.embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, embedding);
            return {
              recordingId: row.recording_id,
              chunkIndex: row.chunk_index,
              text: row.text,
              timestamp: row.timestamp,
              speaker: row.speaker,
              score: similarity,
              startTime: row.start_time,
              endTime: row.end_time
            };
          });

          // Sort by similarity and return top results
          const sortedResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          resolve(sortedResults);
        });
      });
    } catch (error) {
      log.error("Vector search failed:", error);
      return [];
    }
  }

  async textSearch(query: string, limit: number = 10, recordingId?: string): Promise<VectorSearchResult[]> {
    try {
      if (!this.db) return [];

      // Build FTS5 query
      let sql = `
        SELECT c.id, c.recording_id, c.chunk_index, c.text, c.timestamp, c.speaker, c.start_time, c.end_time
        FROM chunks_fts f
        JOIN chunks c ON f.rowid = c.rowid
        WHERE chunks_fts MATCH ?
      `;
      const params: any[] = [query];

      if (recordingId) {
        sql += " AND c.recording_id = ?";
        params.push(recordingId);
      }

      sql += " ORDER BY rank LIMIT ?";
      params.push(limit);

      return new Promise<VectorSearchResult[]>((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        
        this.db.all(sql, params, (err, rows: any[]) => {
          if (err) {
            log.error("Text search failed:", err);
            reject(err);
            return;
          }

          const results = rows.map(row => ({
            recordingId: row.recording_id,
            chunkIndex: row.chunk_index,
            text: row.text,
            timestamp: row.timestamp,
            speaker: row.speaker,
            score: 1.0, // FTS5 doesn't provide similarity scores
            startTime: row.start_time,
            endTime: row.end_time
          }));

          resolve(results);
        });
      });
    } catch (error) {
      log.error("Text search failed:", error);
      return [];
    }
  }

  async hybridSearch(query: string, limit: number = 10, recordingId?: string): Promise<VectorSearchResult[]> {
    try {
      // Get both vector and text search results
      const [vectorResults, textResults] = await Promise.all([
        this.search(query, limit, recordingId),
        this.textSearch(query, limit, recordingId)
      ]);

      // Combine and deduplicate results
      const resultMap = new Map<string, VectorSearchResult>();

      // Add vector results (higher weight)
      vectorResults.forEach(result => {
        const key = `${result.recordingId}-${result.chunkIndex}`;
        resultMap.set(key, { ...result, score: result.score * 0.7 });
      });

      // Add text results (lower weight)
      textResults.forEach(result => {
        const key = `${result.recordingId}-${result.chunkIndex}`;
        if (resultMap.has(key)) {
          // Boost existing result
          const existing = resultMap.get(key)!;
          existing.score += 0.3;
        } else {
          resultMap.set(key, { ...result, score: result.score * 0.3 });
        }
      });

      // Sort by combined score and return top results
      return Array.from(resultMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      log.error("Hybrid search failed:", error);
      return [];
    }
  }

  async getStats() {
    try {
      if (!this.db) {
        return { totalChunks: 0, recordings: 0 };
      }

      return new Promise<{ totalChunks: number; recordings: number }>((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        
        this.db.get("SELECT COUNT(*) as count FROM chunks", (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          this.db.get("SELECT COUNT(DISTINCT recording_id) as count FROM chunks", (err, row2: any) => {
            if (err) {
              reject(err);
              return;
            }

            resolve({
              totalChunks: row.count,
              recordings: row2.count
            });
          });
        });
      });
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

  private async chunkTranscript(transcript: RecordingTranscript): Promise<Document[]> {
    const settings = await getSettings();
    const chunkSize = 1000; // Default chunk size
    const chunkOverlap = 200; // Default chunk overlap

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
        return new Promise<void>((resolve, reject) => {
          this.db!.close((err) => {
            if (err) {
              log.error("Failed to close database:", err);
              reject(err);
            } else {
              log.info("Vector store database closed");
              resolve();
            }
          });
        });
      }
    } catch (error) {
      log.error("Failed to shutdown vector store:", error);
    }
  }
}

// Singleton instance
const vectorStore = new SQLiteVectorStore();

export const initializeVectorStore = async () => {
  try {
    await vectorStore.initialize();
    return true;
  } catch (error) {
    log.error("Failed to initialize vector store:", error);
    log.info("Vector search will be disabled. App will continue with text search only.");
    return false;
  }
};

export const addTranscriptToVectorStore = async (recordingId: string, onProgress?: (progress: number) => void) => {
  await vectorStore.addTranscript(recordingId, onProgress);
  invalidateUiKeys(QueryKeys.VectorStore, QueryKeys.VectorSearch, QueryKeys.HybridSearch);
};

export const removeTranscriptFromVectorStore = async (recordingId: string) => {
  await vectorStore.removeTranscript(recordingId);
  invalidateUiKeys(QueryKeys.VectorStore, QueryKeys.VectorSearch, QueryKeys.HybridSearch);
};

export const vectorSearch = async (
  query: string,
  limit: number = 10,
  recordingId?: string
): Promise<VectorSearchResult[]> => {
  return await vectorStore.search(query, limit, recordingId);
};

export const textSearch = async (
  query: string,
  limit: number = 10,
  recordingId?: string
): Promise<VectorSearchResult[]> => {
  return await vectorStore.textSearch(query, limit, recordingId);
};

export const hybridSearch = async (
  query: string,
  limit: number = 10,
  recordingId?: string
): Promise<VectorSearchResult[]> => {
  return await vectorStore.hybridSearch(query, limit, recordingId);
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