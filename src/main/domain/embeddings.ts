import path from "path";
import fs from "fs-extra";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";
import {
  RecordingTranscript,
  RecordingTranscriptItem,
  Settings,
} from "../../types";
import { embeddingCache } from "./embedding-cache";
import { pullModel } from "./ollama";
import { getSettings } from "./settings";

const embeddingMetadataFileName = "embedding.json";
const embeddingVectorFileName = "embedding.bin";
const storedEmbeddingVersion = 2;
const embeddingBatchSize = 25;
const embeddingVectorEncoding = "float32le" as const;
const float32ByteLength = 4;

type EmbeddingConfiguration = {
  provider: Settings["embeddings"]["provider"];
  model: string;
  configurationKey: string;
  ollamaBaseUrl?: string;
  openaiApiKey?: string;
  openaiBaseURL?: string;
};

type StoredRecordingEmbeddingLine = {
  lineIndex: number;
};

type LoadedStoredRecordingEmbeddingLine = RecordingTranscriptItem &
  StoredRecordingEmbeddingLine & {
    embedding: number[];
  };

type StoredRecordingEmbedding = {
  version: typeof storedEmbeddingVersion;
  createdAt: string;
  provider: Settings["embeddings"]["provider"];
  model: string;
  configurationKey: string;
  vectorDataFile: string;
  vectorDimension: number;
  vectorEncoding: typeof embeddingVectorEncoding;
  lines: StoredRecordingEmbeddingLine[];
};

type LoadedStoredRecordingEmbedding = Omit<
  StoredRecordingEmbedding,
  "lines"
> & {
  lines: LoadedStoredRecordingEmbeddingLine[];
};

type StoredRecordingEmbeddingInput = Omit<
  StoredRecordingEmbedding,
  "vectorDataFile" | "vectorDimension" | "vectorEncoding" | "version"
>;

const embeddingProviderSchema = z.enum(["ollama", "openai"]);

const recordingTranscriptItemSchema: z.ZodType<RecordingTranscriptItem> =
  z.object({
    offsets: z.object({
      from: z.number(),
      to: z.number(),
    }),
    speaker: z.string(),
    text: z.string(),
    timestamps: z.object({
      from: z.string(),
      to: z.string(),
    }),
  });

const recordingTranscriptSchema: z.ZodType<RecordingTranscript> = z.object({
  result: z.object({
    language: z.string(),
  }),
  transcription: z.array(recordingTranscriptItemSchema),
});

const storedRecordingEmbeddingLineSchema: z.ZodType<StoredRecordingEmbeddingLine> =
  z.object({
    lineIndex: z.number().int().nonnegative(),
  });

const storedRecordingEmbeddingSchema: z.ZodType<StoredRecordingEmbedding> =
  z.object({
    configurationKey: z.string(),
    createdAt: z.string(),
    lines: z.array(storedRecordingEmbeddingLineSchema),
    model: z.string(),
    provider: embeddingProviderSchema,
    vectorDataFile: z.string(),
    vectorDimension: z.number().int().positive(),
    vectorEncoding: z.literal(embeddingVectorEncoding),
    version: z.literal(storedEmbeddingVersion),
  });

type SemanticSearchMetadata = {
  recordingId: string;
  lineIndex: number;
  text: string;
  speaker: string;
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
};

export type SemanticSearchMatch = SemanticSearchMetadata & {
  score: number;
};

export type SemanticSearchResult = {
  recordingId: string;
  score: number;
  snippet: string;
  matchedLines: SemanticSearchMatch[];
};

const getRecordingsFolder = async () => {
  return (await getSettings()).core.recordingsFolder;
};

const getRecordingFolder = async (recordingId: string) => {
  return path.join(await getRecordingsFolder(), recordingId);
};

const getTranscriptFilePath = async (recordingId: string) => {
  return path.join(await getRecordingFolder(recordingId), "transcript.json");
};

const readRecordingTranscript = async (recordingId: string) => {
  const filePath = await getTranscriptFilePath(recordingId);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const result = recordingTranscriptSchema.safeParse(
      await fs.readJson(filePath),
    );
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

const getEmbeddingMetadataFilePath = async (recordingId: string) => {
  return path.join(
    await getRecordingFolder(recordingId),
    embeddingMetadataFileName,
  );
};

const getEmbeddingVectorFilePath = async (
  recordingId: string,
  fileName = embeddingVectorFileName,
) => {
  return path.join(await getRecordingFolder(recordingId), fileName);
};

const getSpeakerLabel = (speaker: string) => {
  if (speaker === "0") {
    return "They";
  }

  if (speaker === "1") {
    return "Me";
  }

  return `Speaker ${speaker}`;
};

const formatTextForEmbedding = ({
  speaker,
  text,
}: {
  speaker: string;
  text: string;
}) => {
  return `${getSpeakerLabel(speaker)}: ${text}`.trim();
};

const getEmbeddingSettingsSignature = (settings: Settings) => {
  const { embeddings } = settings;

  if (embeddings.provider === "ollama") {
    return JSON.stringify({
      provider: "ollama",
      model: embeddings.models.ollama,
      baseUrl: settings.providers.ollama.baseUrl,
    });
  }

  return JSON.stringify({
    provider: "openai",
    model: embeddings.models.openai,
    baseURL: settings.providers.openai.useCustomUrl
      ? settings.providers.openai.baseURL ?? null
      : null,
  });
};

const getEmbeddingConfiguration = async (): Promise<EmbeddingConfiguration> => {
  const settings = await getSettings();
  const { embeddings, providers } = settings;
  const configurationKey = getEmbeddingSettingsSignature(settings);

  if (embeddings.provider === "ollama") {
    return {
      provider: "ollama",
      model: embeddings.models.ollama,
      configurationKey,
      ollamaBaseUrl: providers.ollama.baseUrl,
    };
  }

  return {
    provider: "openai",
    model: embeddings.models.openai,
    configurationKey,
    openaiApiKey: providers.openai.apiKey,
    openaiBaseURL: providers.openai.useCustomUrl
      ? providers.openai.baseURL
      : undefined,
  };
};

const createEmbeddingsModel = async (configuration: EmbeddingConfiguration) => {
  if (configuration.provider === "ollama") {
    await pullModel(configuration.model, configuration.ollamaBaseUrl ?? "");
    return new OllamaEmbeddings({
      baseUrl: configuration.ollamaBaseUrl,
      model: configuration.model,
    });
  }

  return new OpenAIEmbeddings({
    apiKey: configuration.openaiApiKey,
    model: configuration.model,
    ...(configuration.openaiBaseURL
      ? { configuration: { baseURL: configuration.openaiBaseURL } }
      : {}),
  });
};

const serializeVectors = (vectors: number[][]) => {
  const vectorDimension = vectors[0]?.length ?? 0;

  if (vectors.length === 0 || vectorDimension === 0) {
    throw new Error("Cannot store embeddings without vector data");
  }

  if (vectors.some((vector) => vector.length !== vectorDimension)) {
    throw new Error("Cannot store embeddings with inconsistent dimensions");
  }

  const buffer = Buffer.alloc(
    vectors.length * vectorDimension * float32ByteLength,
  );
  let offset = 0;

  for (const vector of vectors) {
    for (const value of vector) {
      buffer.writeFloatLE(value, offset);
      offset += float32ByteLength;
    }
  }

  return { buffer, vectorDimension };
};

const deserializeVectors = (
  buffer: Buffer,
  vectorCount: number,
  vectorDimension: number,
) => {
  const expectedByteLength = vectorCount * vectorDimension * float32ByteLength;

  if (buffer.byteLength !== expectedByteLength) {
    throw new Error("Stored embedding data is corrupted");
  }

  return Array.from({ length: vectorCount }, (_, vectorIndex) =>
    Array.from({ length: vectorDimension }, (_, dimensionIndex) =>
      buffer.readFloatLE(
        (vectorIndex * vectorDimension + dimensionIndex) * float32ByteLength,
      ),
    ),
  );
};

const readStoredRecordingEmbeddingManifest = async (recordingId: string) => {
  const filePath = await getEmbeddingMetadataFilePath(recordingId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const result = storedRecordingEmbeddingSchema.safeParse(
      await fs.readJson(filePath),
    );
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

const writeStoredRecordingEmbedding = async (
  recordingId: string,
  stored: StoredRecordingEmbeddingInput,
  vectors: number[][],
) => {
  if (stored.lines.length !== vectors.length) {
    throw new Error("Cannot store embeddings with mismatched metadata");
  }

  const { buffer, vectorDimension } = serializeVectors(vectors);
  const persisted: StoredRecordingEmbedding = {
    ...stored,
    vectorDataFile: embeddingVectorFileName,
    vectorDimension,
    vectorEncoding: embeddingVectorEncoding,
    version: storedEmbeddingVersion,
  };

  await fs.writeFile(
    await getEmbeddingVectorFilePath(recordingId, persisted.vectorDataFile),
    buffer,
  );
  await fs.writeJSON(
    await getEmbeddingMetadataFilePath(recordingId),
    persisted,
    {
      spaces: 2,
    },
  );

  return persisted;
};

async function hasStoredRecordingVectorData(
  recordingId: string,
  stored: StoredRecordingEmbedding | null,
) {
  if (!stored) {
    return false;
  }

  return fs.existsSync(
    await getEmbeddingVectorFilePath(recordingId, stored.vectorDataFile),
  );
}

const isCompatibleStoredRecordingEmbedding = async (
  recordingId: string,
  stored: StoredRecordingEmbedding | null,
  configurationKey: string,
) => {
  return Boolean(
    stored &&
      stored.version === storedEmbeddingVersion &&
      stored.configurationKey === configurationKey &&
      stored.lines.length > 0 &&
      stored.vectorDimension > 0 &&
      fs.existsSync(await getTranscriptFilePath(recordingId)) &&
      (await hasStoredRecordingVectorData(recordingId, stored)),
  );
};

const loadStoredRecordingEmbedding = async (
  recordingId: string,
  stored: StoredRecordingEmbedding,
): Promise<LoadedStoredRecordingEmbedding | null> => {
  const transcript = await readRecordingTranscript(recordingId);

  if (
    !transcript ||
    !(await hasStoredRecordingVectorData(recordingId, stored))
  ) {
    return null;
  }

  const vectorBuffer = await fs.readFile(
    await getEmbeddingVectorFilePath(recordingId, stored.vectorDataFile),
  );
  const vectors = deserializeVectors(
    vectorBuffer,
    stored.lines.length,
    stored.vectorDimension,
  );
  const lines = stored.lines
    .map((line, index) => {
      const transcriptLine = transcript.transcription[line.lineIndex];

      if (!transcriptLine || !transcriptLine.text.trim().length) {
        return null;
      }

      return {
        ...transcriptLine,
        embedding: vectors[index],
        lineIndex: line.lineIndex,
      } satisfies LoadedStoredRecordingEmbeddingLine;
    })
    .filter(
      (line): line is LoadedStoredRecordingEmbeddingLine => line !== null,
    );

  if (lines.length === 0) {
    return null;
  }

  return {
    ...stored,
    lines,
  };
};

const readCompatibleStoredRecordingEmbedding = async (
  recordingId: string,
  configurationKey: string,
) => {
  const stored = await readStoredRecordingEmbeddingManifest(recordingId);

  if (
    !(await isCompatibleStoredRecordingEmbedding(
      recordingId,
      stored,
      configurationKey,
    ))
  ) {
    return null;
  }

  return stored ? loadStoredRecordingEmbedding(recordingId, stored) : null;
};

const listRecordingIds = async () => {
  const recordingsFolder = await getRecordingsFolder();
  const recordingFolders = await fs.readdir(recordingsFolder);
  const visibleFolders = recordingFolders.filter(
    (folder) => !folder.startsWith("."),
  );
  const directories = await Promise.all(
    visibleFolders.map(async (folder) => {
      const stats = await fs.stat(path.join(recordingsFolder, folder));
      return stats.isDirectory() ? folder : null;
    }),
  );

  return directories.filter((folder): folder is string => folder !== null);
};

const loadSemanticSearchStore = async (
  configuration: EmbeddingConfiguration,
) => {
  const store = new MemoryVectorStore(
    await createEmbeddingsModel(configuration),
  );
  const recordingIds = await listRecordingIds();
  const storedEmbeddings = await Promise.all(
    recordingIds.map(async (recordingId) => {
      const stored = await readCompatibleStoredRecordingEmbedding(
        recordingId,
        configuration.configurationKey,
      );
      return stored ? { recordingId, stored } : null;
    }),
  );

  for (const embedding of storedEmbeddings.filter(
    (
      value,
    ): value is {
      recordingId: string;
      stored: LoadedStoredRecordingEmbedding;
    } => value !== null,
  )) {
    const documents = embedding.stored.lines.map(
      (line) =>
        new Document({
          id: `${embedding.recordingId}:${line.lineIndex}`,
          metadata: {
            lineIndex: line.lineIndex,
            offsets: line.offsets,
            recordingId: embedding.recordingId,
            speaker: line.speaker,
            text: line.text,
            timestamps: line.timestamps,
          } satisfies SemanticSearchMetadata,
          pageContent: formatTextForEmbedding(line),
        }),
    );

    await store.addVectors(
      embedding.stored.lines.map((line) => line.embedding),
      documents,
    );
  }

  return store;
};

const getSemanticSearchStore = async () => {
  const configuration = await getEmbeddingConfiguration();
  const cacheKey = `${configuration.configurationKey}:${embeddingCache.semanticStoreVersion}`;

  if (
    embeddingCache.cachedVectorStore &&
    embeddingCache.cachedVectorStoreKey === cacheKey
  ) {
    return embeddingCache.cachedVectorStore;
  }

  const store = await loadSemanticSearchStore(configuration);
  embeddingCache.cachedVectorStore = store;
  embeddingCache.cachedVectorStoreKey = cacheKey;
  return store;
};

export const getCurrentEmbeddingConfigurationKey = async () => {
  return (await getEmbeddingConfiguration()).configurationKey;
};

export const hasCompatibleRecordingEmbedding = async (
  recordingId: string,
  configurationKey?: string,
) => {
  const activeConfigurationKey =
    configurationKey ?? (await getCurrentEmbeddingConfigurationKey());
  const stored = await readStoredRecordingEmbeddingManifest(recordingId);
  return isCompatibleStoredRecordingEmbedding(
    recordingId,
    stored,
    activeConfigurationKey,
  );
};

export const invalidateSemanticSearchStore = () => {
  embeddingCache.invalidate();
};

export const createRecordingEmbedding = async (
  recordingId: string,
  onProgress?: (progress: number) => void,
) => {
  const transcript = await readRecordingTranscript(recordingId);
  if (!transcript) {
    throw new Error("Cannot compute embeddings without a transcript");
  }

  const lines = transcript.transcription
    .map((line, lineIndex) => ({ ...line, lineIndex }))
    .filter((line) => line.text.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("Cannot compute embeddings for an empty transcript");
  }

  const configuration = await getEmbeddingConfiguration();
  const embeddingsModel = await createEmbeddingsModel(configuration);
  const batches = Array.from(
    { length: Math.ceil(lines.length / embeddingBatchSize) },
    (_, batchIndex) =>
      lines.slice(
        batchIndex * embeddingBatchSize,
        (batchIndex + 1) * embeddingBatchSize,
      ),
  );

  const embeddedLines: StoredRecordingEmbeddingLine[] = [];
  const embeddedVectors: number[][] = [];
  onProgress?.(0);

  for (const batch of batches) {
    const vectors = await embeddingsModel.embedDocuments(
      batch.map((line) => formatTextForEmbedding(line)),
    );

    if (vectors.length !== batch.length) {
      throw new Error(
        "Embedding model returned an unexpected number of vectors",
      );
    }

    embeddedLines.push(...batch.map((line) => ({ lineIndex: line.lineIndex })));
    embeddedVectors.push(...vectors);

    onProgress?.(embeddedLines.length / lines.length);
  }

  const stored = await writeStoredRecordingEmbedding(
    recordingId,
    {
      configurationKey: configuration.configurationKey,
      createdAt: new Date().toISOString(),
      lines: embeddedLines,
      model: configuration.model,
      provider: configuration.provider,
    },
    embeddedVectors,
  );
  invalidateSemanticSearchStore();
  return stored;
};

export const semanticSearch = async (
  query: string,
  limit = 20,
): Promise<SemanticSearchResult[]> => {
  if (!query.trim().length) {
    return [];
  }

  const store = await getSemanticSearchStore();
  const results = await store.similaritySearchWithScore(query, limit);
  const groupedResults = new Map<string, SemanticSearchResult>();

  for (const [document, score] of results) {
    const metadata = document.metadata as SemanticSearchMetadata;
    const match: SemanticSearchMatch = {
      lineIndex: metadata.lineIndex,
      offsets: metadata.offsets,
      recordingId: metadata.recordingId,
      score,
      speaker: metadata.speaker,
      text: metadata.text,
      timestamps: metadata.timestamps,
    };
    const existingResult = groupedResults.get(metadata.recordingId);

    if (!existingResult) {
      groupedResults.set(metadata.recordingId, {
        matchedLines: [match],
        recordingId: metadata.recordingId,
        score,
        snippet: metadata.text,
      });
    } else {
      if (
        !existingResult.matchedLines.some(
          (line) => line.lineIndex === match.lineIndex,
        )
      ) {
        existingResult.matchedLines.push(match);
      }

      if (score > existingResult.score) {
        existingResult.score = score;
        existingResult.snippet = metadata.text;
      }
    }
  }

  return [...groupedResults.values()]
    .map((result) => ({
      ...result,
      matchedLines: result.matchedLines
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    }))
    .sort((a, b) => b.score - a.score);
};
