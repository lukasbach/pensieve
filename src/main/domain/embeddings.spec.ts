import path from "path";

export {};

const {
  existsSyncMock,
  getSettingsMock,
  memoryStoreAddVectorsMock,
  memoryStoreSimilaritySearchWithScoreMock,
  ollamaEmbedDocumentsMock,
  pullModelMock,
  readFileMock,
  readJsonMock,
  readdirMock,
  statMock,
  writeFileMock,
  writeJSONMock,
} = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
  getSettingsMock: vi.fn(),
  memoryStoreAddVectorsMock: vi.fn(),
  memoryStoreSimilaritySearchWithScoreMock: vi.fn(),
  ollamaEmbedDocumentsMock: vi.fn(),
  pullModelMock: vi.fn(),
  readFileMock: vi.fn(),
  readJsonMock: vi.fn(),
  readdirMock: vi.fn(),
  statMock: vi.fn(),
  writeFileMock: vi.fn(),
  writeJSONMock: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    existsSync: existsSyncMock,
    readFile: readFileMock,
    readJson: readJsonMock,
    readdir: readdirMock,
    stat: statMock,
    writeFile: writeFileMock,
    writeJSON: writeJSONMock,
  },
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./ollama", () => ({
  pullModel: pullModelMock,
}));

vi.mock("@langchain/ollama", () => ({
  OllamaEmbeddings: function OllamaEmbeddingsMock() {
    return {
      embedDocuments: ollamaEmbedDocumentsMock,
    };
  },
}));

vi.mock("@langchain/openai", () => ({
  OpenAIEmbeddings: function OpenAIEmbeddingsMock() {
    return {};
  },
}));

vi.mock("@langchain/classic/vectorstores/memory", () => ({
  MemoryVectorStore: function MemoryVectorStoreMock() {
    const state = { documents: [] as unknown[] };

    return {
      addVectors: async (vectors: number[][], documents: unknown[]) => {
        memoryStoreAddVectorsMock(vectors, documents);
        state.documents = [...state.documents, ...documents];
      },
      similaritySearchWithScore: async (query: string, limit: number) => {
        return memoryStoreSimilaritySearchWithScoreMock(
          state.documents,
          query,
          limit,
        );
      },
    };
  },
}));

const createVectorBuffer = (vectors: number[][]) => {
  const buffer = Buffer.alloc(vectors.flat().length * 4);
  let offset = 0;

  for (const vector of vectors) {
    for (const value of vector) {
      buffer.writeFloatLE(value, offset);
      offset += 4;
    }
  }

  return buffer;
};

describe("embeddings", () => {
  const recordingsFolder = "C:\\Recordings";

  beforeEach(() => {
    vi.resetModules();
    existsSyncMock.mockReset();
    getSettingsMock.mockReset();
    memoryStoreAddVectorsMock.mockReset();
    memoryStoreSimilaritySearchWithScoreMock.mockReset();
    ollamaEmbedDocumentsMock.mockReset();
    pullModelMock.mockReset();
    readFileMock.mockReset();
    readJsonMock.mockReset();
    readdirMock.mockReset();
    statMock.mockReset();
    writeFileMock.mockReset();
    writeJSONMock.mockReset();

    getSettingsMock.mockResolvedValue({
      core: { recordingsFolder },
      providers: {
        ollama: {
          baseUrl: "http://localhost:11434",
        },
        openai: {
          apiKey: "sk-test",
          baseURL: undefined,
          useCustomUrl: false,
        },
      },
      embeddings: {
        enabled: true,
        provider: "ollama",
        models: {
          ollama: "mxbai-embed-large",
          openai: "text-embedding-3-small",
        },
      },
    });
  });

  it("creates and stores recording embeddings as binary vector data", async () => {
    existsSyncMock.mockReturnValue(true);
    readJsonMock.mockResolvedValue({
      result: { language: "en" },
      transcription: [
        {
          offsets: { from: 0, to: 10 },
          speaker: "1",
          text: "Roadmap discussion",
          timestamps: { from: "0", to: "1" },
        },
        {
          offsets: { from: 11, to: 20 },
          speaker: "0",
          text: "Ship date",
          timestamps: { from: "1", to: "2" },
        },
      ],
    });
    ollamaEmbedDocumentsMock.mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);

    const embeddings = await import("./embeddings");
    const onProgress = vi.fn();

    await embeddings.createRecordingEmbedding("recording-1", onProgress);

    expect(pullModelMock).toHaveBeenCalledWith(
      "mxbai-embed-large",
      "http://localhost:11434",
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(recordingsFolder, "recording-1", "embedding.bin"),
      expect.any(Buffer),
    );

    const vectorBuffer = writeFileMock.mock.calls[0]?.[1] as Buffer;
    expect(vectorBuffer.readFloatLE(0)).toBeCloseTo(0.1);
    expect(vectorBuffer.readFloatLE(4)).toBeCloseTo(0.2);
    expect(vectorBuffer.readFloatLE(8)).toBeCloseTo(0.3);
    expect(vectorBuffer.readFloatLE(12)).toBeCloseTo(0.4);

    expect(writeJSONMock).toHaveBeenCalledWith(
      path.join(recordingsFolder, "recording-1", "embedding.json"),
      expect.objectContaining({
        configurationKey: JSON.stringify({
          provider: "ollama",
          model: "mxbai-embed-large",
          baseUrl: "http://localhost:11434",
        }),
        model: "mxbai-embed-large",
        provider: "ollama",
        vectorDataFile: "embedding.bin",
        vectorDimension: 2,
        vectorEncoding: "float32le",
        version: 2,
      }),
      { spaces: 2 },
    );

    const manifest = writeJSONMock.mock.calls[0]?.[1];
    expect(manifest.lines).toEqual([{ lineIndex: 0 }, { lineIndex: 1 }]);
    expect(manifest.lines[0]).not.toHaveProperty("text");
    expect(onProgress).toHaveBeenNthCalledWith(1, 0);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it("loads binary stored embeddings into the semantic search store and groups results", async () => {
    getSettingsMock.mockResolvedValue({
      core: { recordingsFolder },
      providers: {
        ollama: {
          baseUrl: "http://localhost:11434",
        },
        openai: {
          apiKey: "sk-test",
          baseURL: undefined,
          useCustomUrl: false,
        },
      },
      embeddings: {
        enabled: true,
        provider: "openai",
        models: {
          ollama: "mxbai-embed-large",
          openai: "text-embedding-3-small",
        },
      },
    });
    existsSyncMock.mockReturnValue(true);
    readdirMock.mockResolvedValue(["alpha", "beta"]);
    statMock.mockResolvedValue({ isDirectory: () => true });
    readJsonMock.mockImplementation(async (filePath: string) => {
      if (filePath.includes("alpha") && filePath.endsWith("embedding.json")) {
        return {
          configurationKey: JSON.stringify({
            provider: "openai",
            model: "text-embedding-3-small",
            baseURL: null,
          }),
          lines: [{ lineIndex: 0 }],
          createdAt: "2026-04-03T00:00:00.000Z",
          model: "text-embedding-3-small",
          provider: "openai",
          vectorDataFile: "embedding.bin",
          vectorDimension: 1,
          vectorEncoding: "float32le",
          version: 2,
        };
      }

      if (filePath.includes("alpha") && filePath.endsWith("transcript.json")) {
        return {
          result: { language: "en" },
          transcription: [
            {
              offsets: { from: 0, to: 8 },
              speaker: "1",
              text: "Roadmap milestone",
              timestamps: { from: "0", to: "1" },
            },
          ],
        };
      }

      if (filePath.includes("beta") && filePath.endsWith("embedding.json")) {
        return {
          configurationKey: JSON.stringify({
            provider: "openai",
            model: "text-embedding-3-small",
            baseURL: null,
          }),
          lines: [{ lineIndex: 0 }, { lineIndex: 1 }],
          createdAt: "2026-04-03T00:00:00.000Z",
          model: "text-embedding-3-small",
          provider: "openai",
          vectorDataFile: "embedding.bin",
          vectorDimension: 1,
          vectorEncoding: "float32le",
          version: 2,
        };
      }

      return {
        result: { language: "en" },
        transcription: [
          {
            offsets: { from: 10, to: 20 },
            speaker: "0",
            text: "Budget concerns",
            timestamps: { from: "1", to: "2" },
          },
          {
            offsets: { from: 21, to: 30 },
            speaker: "1",
            text: "Release planning",
            timestamps: { from: "2", to: "3" },
          },
        ],
      };
    });
    readFileMock.mockImplementation(async (filePath: string) =>
      filePath.includes("alpha")
        ? createVectorBuffer([[0.1]])
        : createVectorBuffer([[0.2], [0.3]]),
    );
    memoryStoreSimilaritySearchWithScoreMock.mockImplementation(
      async (documents: any[]) => [
        [documents[1], 0.95],
        [documents[2], 0.9],
        [documents[0], 0.4],
      ],
    );

    const embeddings = await import("./embeddings");
    const results = await embeddings.semanticSearch("release");

    expect(memoryStoreAddVectorsMock).toHaveBeenCalledTimes(2);
    const firstStoredVectors = memoryStoreAddVectorsMock.mock.calls[0]?.[0];
    const secondStoredVectors = memoryStoreAddVectorsMock.mock.calls[1]?.[0];

    expect(firstStoredVectors[0][0]).toBeCloseTo(0.1);
    expect(secondStoredVectors[0][0]).toBeCloseTo(0.2);
    expect(secondStoredVectors[1][0]).toBeCloseTo(0.3);
    expect(results).toEqual([
      expect.objectContaining({
        matchedLines: [
          expect.objectContaining({ text: "Budget concerns" }),
          expect.objectContaining({ text: "Release planning" }),
        ],
        recordingId: "beta",
        score: 0.95,
        snippet: "Budget concerns",
      }),
      expect.objectContaining({
        matchedLines: [expect.objectContaining({ text: "Roadmap milestone" })],
        recordingId: "alpha",
        score: 0.4,
        snippet: "Roadmap milestone",
      }),
    ]);
  });

});
