export {};

const {
  getRecordingMetaMock,
  getRecordingTranscriptMock,
  getSettingsMock,
  listRecordingsMock,
  openRecordingWindowMock,
  searchMock,
} = vi.hoisted(() => ({
  getRecordingMetaMock: vi.fn(),
  getRecordingTranscriptMock: vi.fn(),
  getSettingsMock: vi.fn(),
  listRecordingsMock: vi.fn(),
  openRecordingWindowMock: vi.fn(),
  searchMock: vi.fn(),
}));

vi.mock("./history", () => ({
  getRecordingMeta: getRecordingMetaMock,
  getRecordingTranscript: getRecordingTranscriptMock,
  listRecordings: listRecordingsMock,
}));

vi.mock("./search", () => ({
  search: searchMock,
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./windows", () => ({
  openRecordingWindow: openRecordingWindowMock,
}));

const createTranscriptLine = (text: string, lineIndex: number) => ({
  offsets: { from: lineIndex * 10, to: lineIndex * 10 + 5 },
  speaker: `${lineIndex}`,
  text,
  timestamps: {
    from: `00:00:0${lineIndex}.000`,
    to: `00:00:0${lineIndex + 1}.000`,
  },
});

describe("mcpTools", () => {
  beforeEach(() => {
    vi.resetModules();
    getRecordingMetaMock.mockReset();
    getRecordingTranscriptMock.mockReset();
    getSettingsMock.mockReset();
    listRecordingsMock.mockReset();
    openRecordingWindowMock.mockReset();
    searchMock.mockReset();
    getSettingsMock.mockResolvedValue({
      embeddings: { enabled: false },
    });
  });

  it("paginates and filters recordings without a search query", async () => {
    listRecordingsMock.mockResolvedValue({
      alpha: { name: "Alpha", started: "2024-01-01T10:00:00.000Z" },
      beta: { name: "Beta", started: "2024-01-02T10:00:00.000Z" },
      gamma: { name: "Gamma", started: "2024-01-03T10:00:00.000Z" },
    });

    const { mcpTools } = await import("./mcp-tools");
    const result = await mcpTools.queryRecordings({
      offset: 1,
      startDate: "2024-01-02T00:00:00.000Z",
    });

    expect(result).toEqual(
      expect.objectContaining({
        limit: 20,
        mode: "all",
        offset: 1,
        totalResults: 2,
      }),
    );
    expect(result.items.map(({ recordingId }) => recordingId)).toEqual([
      "beta",
    ]);
  });

  it("returns transcript line matches for text search results", async () => {
    listRecordingsMock.mockResolvedValue({
      alpha: { name: "Alpha", started: "2024-01-01T10:00:00.000Z" },
      beta: { name: "Beta", started: "2024-01-02T10:00:00.000Z" },
    });
    searchMock.mockResolvedValue({
      matches: {
        alpha: { snippet: "...release planning..." },
        beta: { snippet: "...release review..." },
      },
      mode: "text",
      orderedIds: [],
    });
    getRecordingTranscriptMock.mockImplementation(
      async (recordingId: string) => ({
        result: { language: "en" },
        transcription:
          recordingId === "beta"
            ? [
                createTranscriptLine("Release review and follow-up", 0),
                createTranscriptLine("Actions", 1),
              ]
            : [
                createTranscriptLine("Release planning for next sprint", 0),
                createTranscriptLine("Backlog", 1),
              ],
      }),
    );

    const { mcpTools } = await import("./mcp-tools");
    const result = await mcpTools.queryRecordings({ search: "release" });

    expect(searchMock).toHaveBeenCalledWith("release", {
      useSemanticSearch: false,
    });
    expect(result.mode).toBe("text");
    expect(result.items.map(({ recordingId }) => recordingId)).toEqual([
      "beta",
      "alpha",
    ]);
    expect(result.items[0]?.matchedLines).toEqual([
      expect.objectContaining({ lineIndex: 0, lineNumber: 1 }),
    ]);
  });

  it("preserves semantic result ordering and scores", async () => {
    listRecordingsMock.mockResolvedValue({
      alpha: { name: "Alpha", started: "2024-01-01T10:00:00.000Z" },
      beta: { name: "Beta", started: "2024-01-02T10:00:00.000Z" },
    });
    searchMock.mockResolvedValue({
      matches: {
        alpha: {
          matchedLines: [
            {
              lineIndex: 2,
              offsets: { from: 20, to: 25 },
              recordingId: "alpha",
              score: 0.91,
              speaker: "0",
              text: "Launch blockers",
              timestamps: { from: "00:00:02.000", to: "00:00:03.000" },
            },
          ],
          score: 0.91,
          snippet: "Launch blockers",
        },
        beta: {
          matchedLines: [],
          score: 0.75,
          snippet: "Roadmap",
        },
      },
      mode: "semantic",
      orderedIds: ["alpha", "beta"],
    });
    getSettingsMock.mockResolvedValue({
      embeddings: { enabled: true },
    });

    const { mcpTools } = await import("./mcp-tools");
    const result = await mcpTools.queryRecordings({ search: "launch" });

    expect(searchMock).toHaveBeenCalledWith("launch", {
      useSemanticSearch: true,
    });
    expect(result.mode).toBe("semantic");
    expect(result.items.map(({ recordingId }) => recordingId)).toEqual([
      "alpha",
      "beta",
    ]);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        score: 0.91,
        snippet: "Launch blockers",
      }),
    );
    expect(result.items[0]?.matchedLines[0]).toEqual(
      expect.objectContaining({ lineIndex: 2, lineNumber: 3, score: 0.91 }),
    );
  });

  it("reads transcript slices with 1-based line numbers", async () => {
    getRecordingTranscriptMock.mockResolvedValue({
      result: { language: "en" },
      transcription: [
        createTranscriptLine("First", 0),
        createTranscriptLine("Second", 1),
        createTranscriptLine("Third", 2),
      ],
    });

    const { mcpTools } = await import("./mcp-tools");
    const result = await mcpTools.readTranscript({
      length: 1,
      recordingId: "alpha",
      startLine: 2,
    });

    expect(result).toEqual(
      expect.objectContaining({
        returnedLines: 1,
        startLine: 2,
        totalLines: 3,
      }),
    );
    expect(result.lines).toEqual([
      expect.objectContaining({ lineIndex: 1, lineNumber: 2, text: "Second" }),
    ]);
  });

  it("opens a recording window for valid recording ids", async () => {
    getRecordingMetaMock.mockResolvedValue({
      name: "Alpha",
      started: "2024-01-01T10:00:00.000Z",
    });

    const { mcpTools } = await import("./mcp-tools");
    const result = await mcpTools.openRecording({
      highlightedLine: 7,
      recordingId: "alpha",
    });

    expect(openRecordingWindowMock).toHaveBeenCalledWith("alpha", 7);
    expect(result).toEqual({
      highlightedLine: 7,
      ok: true,
      recordingId: "alpha",
    });
  });
});
