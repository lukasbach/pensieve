const { getRecordingTranscriptMock, listRecordingsMock } = vi.hoisted(() => ({
  getRecordingTranscriptMock: vi.fn(),
  listRecordingsMock: vi.fn(),
}));

vi.mock("./history", () => ({
  getRecordingTranscript: getRecordingTranscriptMock,
  listRecordings: listRecordingsMock,
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
    getRecordingTranscriptMock.mockReset();
    listRecordingsMock.mockReset();
  });

  it("indexes titles and transcripts during initialization", async () => {
    listRecordingsMock.mockResolvedValue({
      first: { name: "Daily Sync", started: "2024-01-01T10:00:00.000Z" },
      second: { started: "2024-01-02T10:00:00.000Z" },
    });
    getRecordingTranscriptMock.mockImplementation(
      async (recordingId: string) =>
        recordingId === "first"
          ? createTranscript(
              "The team reviewed roadmap milestones, customer feedback, and release planning for next month.",
            )
          : createTranscript(
              "We finished customer handoff preparation before the release checklist and deployment dry run.",
            ),
    );

    const searchModule = await import("./search");

    await searchModule.initializeSearchIndex();

    expect(searchModule.search("daily")).toEqual({ first: true });
    expect(searchModule.search("release").second).toEqual(
      expect.stringContaining("release"),
    );
  });

  it("updates recording names and transcript snippets independently", async () => {
    getRecordingTranscriptMock.mockResolvedValue(
      createTranscript(
        "The meeting covered product telemetry, customer insights, analytics trends, action items, and the onboarding funnel.",
      ),
    );

    const searchModule = await import("./search");

    await searchModule.addRecordingToIndex("recording-1");
    searchModule.updateRecordingName("recording-1", "Weekly Review");

    expect(searchModule.search("review")).toEqual({ "recording-1": true });
    expect(searchModule.search("analytics")["recording-1"]).toEqual(
      expect.stringContaining("analytics"),
    );
  });

  it("removes recordings from both indexes", async () => {
    getRecordingTranscriptMock.mockResolvedValue(
      createTranscript("Discussed support queue triage and bug fixes."),
    );

    const searchModule = await import("./search");

    await searchModule.addRecordingToIndex("recording-2");
    searchModule.updateRecordingName("recording-2", "Support Triage");
    searchModule.removeRecordingFromIndex("recording-2");

    expect(searchModule.search("support")).toEqual({});
  });
});
