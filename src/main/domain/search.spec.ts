const {
  existsSyncMock,
  getSettingsMock,
  readJsonMock,
  readdirMock,
  semanticSearchMock,
  statMock,
} = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
  getSettingsMock: vi.fn(),
  readJsonMock: vi.fn(),
  readdirMock: vi.fn(),
  semanticSearchMock: vi.fn(),
  statMock: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    existsSync: existsSyncMock,
    readJson: readJsonMock,
    readdir: readdirMock,
    stat: statMock,
  },
}));

vi.mock("./embeddings", () => ({
  semanticSearch: semanticSearchMock,
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

const createTranscript = (text: string) => ({
  result: { language: "en" },
  transcription: [
    {
      timestamps: { from: "00:00:00.000", to: "00:00:05.000" },
      offsets: { from: 0, to: 5 },
      text,
      speaker: "Speaker 1",
    },
  ],
});

describe("search", () => {
  beforeEach(() => {
    vi.resetModules();
    existsSyncMock.mockReset();
    getSettingsMock.mockReset();
    readJsonMock.mockReset();
    readdirMock.mockReset();
    semanticSearchMock.mockReset();
    statMock.mockReset();

    getSettingsMock.mockResolvedValue({
      core: { recordingsFolder: "C:\\Recordings" },
    });
  });

  it("indexes titles and transcripts during initialization", async () => {
    readdirMock.mockResolvedValue(["first", "second"]);
    statMock.mockResolvedValue({ isDirectory: () => true });
    existsSyncMock.mockReturnValue(true);
    readJsonMock.mockImplementation(async (filePath: string) =>
      filePath.includes("first") && filePath.endsWith("meta.json")
        ? { name: "Daily Sync", started: "2024-01-01T10:00:00.000Z" }
        : filePath.includes("second") && filePath.endsWith("meta.json")
          ? { started: "2024-01-02T10:00:00.000Z" }
          : filePath.includes("first")
            ? createTranscript(
                "The team reviewed roadmap milestones, customer feedback, and release planning for next month.",
              )
            : createTranscript(
                "We finished customer handoff preparation before the release checklist and deployment dry run.",
              ),
    );

    const searchModule = await import("./search");

    await searchModule.initializeSearchIndex();

    await expect(searchModule.search("daily")).resolves.toEqual({
      matches: { first: {} },
      mode: "text",
      orderedIds: [],
    });
    await expect(searchModule.search("release")).resolves.toEqual(
      expect.objectContaining({
        matches: expect.objectContaining({
          second: expect.objectContaining({
            snippet: expect.stringContaining("release"),
          }),
        }),
      }),
    );
  });

  it("updates recording names and transcript snippets independently", async () => {
    existsSyncMock.mockReturnValue(true);
    readJsonMock.mockResolvedValue(
      createTranscript(
        "The meeting covered product telemetry, customer insights, analytics trends, action items, and the onboarding funnel.",
      ),
    );

    const searchModule = await import("./search");

    await searchModule.addRecordingToIndex("recording-1");
    searchModule.updateRecordingName("recording-1", "Weekly Review");

    await expect(searchModule.search("review")).resolves.toEqual({
      matches: { "recording-1": {} },
      mode: "text",
      orderedIds: [],
    });
    await expect(searchModule.search("analytics")).resolves.toEqual(
      expect.objectContaining({
        matches: {
          "recording-1": expect.objectContaining({
            snippet: expect.stringContaining("analytics"),
          }),
        },
      }),
    );
  });

  it("removes recordings from both indexes", async () => {
    existsSyncMock.mockReturnValue(true);
    readJsonMock.mockResolvedValue(
      createTranscript("Discussed support queue triage and bug fixes."),
    );

    const searchModule = await import("./search");

    await searchModule.addRecordingToIndex("recording-2");
    searchModule.updateRecordingName("recording-2", "Support Triage");
    searchModule.removeRecordingFromIndex("recording-2");

    await expect(searchModule.search("support")).resolves.toEqual({
      matches: {},
      mode: "text",
      orderedIds: [],
    });
  });

  it("returns semantic search results when requested", async () => {
    semanticSearchMock.mockResolvedValue([
      {
        matchedLines: [],
        recordingId: "recording-3",
        score: 0.88,
        snippet: "Release planning",
      },
    ]);

    const searchModule = await import("./search");

    await expect(
      searchModule.search("release", { useSemanticSearch: true }),
    ).resolves.toEqual({
      matches: {
        "recording-3": {
          matchedLines: [],
          score: 0.88,
          snippet: "Release planning",
        },
      },
      mode: "semantic",
      orderedIds: ["recording-3"],
    });
  });
});
