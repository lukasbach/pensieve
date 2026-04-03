export {};

const { ffmpegMock, historyMock, modelsMock, whisperMock } = vi.hoisted(() => ({
  ffmpegMock: { simpleTranscode: vi.fn() },
  historyMock: { listRecordings: vi.fn() },
  modelsMock: { prepareConfiguredModel: vi.fn() },
  whisperMock: { processWavFile: vi.fn() },
}));

vi.mock("./ffmpeg", () => ffmpegMock);
vi.mock("./history", () => historyMock);
vi.mock("./models", () => modelsMock);
vi.mock("./whisper", () => whisperMock);

describe("domain index", () => {
  it("re-exports the primary domain modules", async () => {
    const domain = await import("./index");

    expect(domain.ffmpeg.simpleTranscode).toBe(ffmpegMock.simpleTranscode);
    expect(domain.history.listRecordings).toBe(historyMock.listRecordings);
    expect(domain.models.prepareConfiguredModel).toBe(
      modelsMock.prepareConfiguredModel,
    );
    expect(domain.whisper.processWavFile).toBe(whisperMock.processWavFile);
  });
});
