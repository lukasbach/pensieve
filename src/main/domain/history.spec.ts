import path from "path";
import { QueryKeys } from "../../query-keys";

export {};

const {
  addToQueueMock,
  appGetPathMock,
  ensureDirMock,
  existsSyncMock,
  getDurationMock,
  getSettingsMock,
  invalidateUiKeysMock,
  moveMock,
  openPathMock,
  outputFileMock,
  readJsonMock,
  readdirMock,
  removeMock,
  removeRecordingFromIndexMock,
  simpleTranscodeMock,
  startQueueMock,
  statMock,
  updateRecordingNameMock,
  writeFileMock,
  writeJsonMock,
  writeJSONMock,
} = vi.hoisted(() => ({
  addToQueueMock: vi.fn(),
  appGetPathMock: vi.fn(),
  ensureDirMock: vi.fn(),
  existsSyncMock: vi.fn(),
  getDurationMock: vi.fn(),
  getSettingsMock: vi.fn(),
  invalidateUiKeysMock: vi.fn(),
  moveMock: vi.fn(),
  openPathMock: vi.fn(),
  outputFileMock: vi.fn(),
  readJsonMock: vi.fn(),
  readdirMock: vi.fn(),
  removeMock: vi.fn(),
  removeRecordingFromIndexMock: vi.fn(),
  simpleTranscodeMock: vi.fn(),
  startQueueMock: vi.fn(),
  statMock: vi.fn(),
  updateRecordingNameMock: vi.fn(),
  writeFileMock: vi.fn(),
  writeJsonMock: vi.fn(),
  writeJSONMock: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getPath: appGetPathMock },
  shell: { openPath: openPathMock },
}));

vi.mock("fs-extra", () => ({
  default: {
    ensureDir: ensureDirMock,
    existsSync: existsSyncMock,
    move: moveMock,
    outputFile: outputFileMock,
    readJson: readJsonMock,
    readdir: readdirMock,
    remove: removeMock,
    stat: statMock,
    writeFile: writeFileMock,
    writeJson: writeJsonMock,
    writeJSON: writeJSONMock,
  },
}));

vi.mock("../ipc/invalidate-ui", () => ({
  invalidateUiKeys: invalidateUiKeysMock,
}));

vi.mock("./search", () => ({
  removeRecordingFromIndex: removeRecordingFromIndexMock,
  updateRecordingName: updateRecordingNameMock,
}));

vi.mock("./ffmpeg", () => ({
  getDuration: getDurationMock,
  simpleTranscode: simpleTranscodeMock,
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./postprocess", () => ({
  addToQueue: addToQueueMock,
  startQueue: startQueueMock,
}));

describe("history", () => {
  const recordingsFolder = "C:\\Recordings";
  const userDataFolder = "C:\\Users\\tester\\AppData\\Roaming\\Pensieve";

  beforeEach(() => {
    vi.resetModules();
    addToQueueMock.mockReset();
    appGetPathMock.mockReset();
    ensureDirMock.mockReset();
    existsSyncMock.mockReset();
    getDurationMock.mockReset();
    getSettingsMock.mockReset();
    invalidateUiKeysMock.mockReset();
    moveMock.mockReset();
    openPathMock.mockReset();
    outputFileMock.mockReset();
    readJsonMock.mockReset();
    readdirMock.mockReset();
    removeMock.mockReset();
    removeRecordingFromIndexMock.mockReset();
    simpleTranscodeMock.mockReset();
    startQueueMock.mockReset();
    statMock.mockReset();
    updateRecordingNameMock.mockReset();
    writeFileMock.mockReset();
    writeJsonMock.mockReset();
    writeJSONMock.mockReset();

    appGetPathMock.mockReturnValue(userDataFolder);
    getSettingsMock.mockResolvedValue({
      core: { recordingsFolder },
      ffmpeg: { autoTriggerPostProcess: false },
    });
  });

  it("reads and initializes the recordings folders", async () => {
    const history = await import("./history");

    await expect(history.getRecordingsFolder()).resolves.toBe(recordingsFolder);
    await history.init();

    expect(ensureDirMock).toHaveBeenCalledWith(recordingsFolder);
    expect(history.getUnassociatedImagesFolder()).toBe(
      path.join(userDataFolder, "unassociated-images"),
    );
  });

  it("stores unassociated screenshots and rejects non-png files", async () => {
    const history = await import("./history");
    const data = new Uint8Array([1, 2, 3]);

    await history.storeUnassociatedScreenshot("capture.png", data);

    expect(outputFileMock).toHaveBeenCalledWith(
      path.join(userDataFolder, "unassociated-images", "capture.png"),
      data,
    );

    await expect(
      history.storeUnassociatedScreenshot("capture.jpg", data),
    ).rejects.toThrow("Only PNG files are supported");
  });

  it("saves recordings, moves screenshots, and auto-queues postprocessing", async () => {
    getSettingsMock.mockResolvedValue({
      core: { recordingsFolder },
      ffmpeg: { autoTriggerPostProcess: true },
    });
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2024-01-02T03:04:15").getTime(),
    );

    const history = await import("./history");
    const mic = new Uint8Array([1, 2]).buffer;
    const screen = new Uint8Array([3, 4]).buffer;
    const recordingId = "2024-1-2_3-4-5";
    const folder = path.join(recordingsFolder, recordingId);

    await history.saveRecording({
      mic,
      screen,
      meta: {
        started: "2024-01-02T03:04:05",
        name: "Daily Sync",
        screenshots: { 5: "capture.png" },
      },
    });

    expect(ensureDirMock).toHaveBeenCalledWith(folder);
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(folder, "mic.webm"),
      expect.any(Buffer),
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(folder, "screen.webm"),
      expect.any(Buffer),
    );
    expect(writeJSONMock).toHaveBeenCalledWith(
      path.join(folder, "meta.json"),
      expect.objectContaining({
        duration: 10000,
        hasMic: true,
        hasRawRecording: true,
        hasScreen: true,
        isPostProcessed: false,
        name: "Daily Sync",
      }),
      { spaces: 2 },
    );
    expect(moveMock).toHaveBeenCalledWith(
      path.join(userDataFolder, "unassociated-images", "capture.png"),
      path.join(folder, "capture.png"),
    );
    expect(updateRecordingNameMock).toHaveBeenCalledWith(
      expect.any(String),
      "Daily Sync",
    );
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.History);
    expect(addToQueueMock).toHaveBeenCalledWith({ recordingId });
    expect(startQueueMock).toHaveBeenCalledTimes(1);
  });

  it("imports recordings and writes imported metadata", async () => {
    getDurationMock.mockResolvedValue(42);

    const history = await import("./history");
    const recordingId = "2024-2-3_4-5-6";
    const folder = path.join(recordingsFolder, recordingId);
    const meta = {
      started: "2024-02-03T04:05:06",
      name: "Imported recording",
    };

    await history.importRecording("C:\\temp\\input.webm", meta);

    expect(ensureDirMock).toHaveBeenCalledWith(folder);
    expect(simpleTranscodeMock).toHaveBeenCalledWith(
      "C:\\temp\\input.webm",
      path.join(folder, "screen.webm"),
    );
    expect(writeJSONMock).toHaveBeenCalledWith(
      path.join(folder, "meta.json"),
      expect.objectContaining({
        duration: 42,
        isImported: true,
        name: "Imported recording",
      }),
      { spaces: 2 },
    );
    expect(addToQueueMock).not.toHaveBeenCalled();
    expect(startQueueMock).not.toHaveBeenCalled();
  });

  it("lists recordings from visible directories in reverse order", async () => {
    readdirMock.mockResolvedValue([
      "2024-1-1_1-0-0",
      ".DS_Store",
      "notes.txt",
      "2024-1-2_2-0-0",
    ]);
    statMock.mockImplementation(async (folderPath: string) => ({
      isDirectory: () => !folderPath.endsWith("notes.txt"),
    }));
    readJsonMock.mockImplementation(async (filePath: string) =>
      filePath.includes("2024-1-1_1-0-0")
        ? { started: "2024-01-01T01:00:00.000Z", name: "Older" }
        : { started: "2024-01-02T02:00:00.000Z", name: "Newer" },
    );

    const history = await import("./history");
    const result = await history.listRecordings();

    expect(Object.keys(result)).toEqual(["2024-1-2_2-0-0", "2024-1-1_1-0-0"]);
    expect(result["2024-1-2_2-0-0"]).toEqual(
      expect.objectContaining({ name: "Newer" }),
    );
  });

  it("reads meta, transcript, and generated audio files", async () => {
    readJsonMock
      .mockResolvedValueOnce({ started: "2024-01-01T01:00:00.000Z" })
      .mockResolvedValueOnce({ transcription: [] });
    existsSyncMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const history = await import("./history");

    await expect(history.getRecordingMeta("recording-1")).resolves.toEqual({
      started: "2024-01-01T01:00:00.000Z",
    });
    await expect(
      history.getRecordingTranscript("recording-1"),
    ).resolves.toBeNull();
    await expect(
      history.getRecordingTranscript("recording-1"),
    ).resolves.toEqual({
      transcription: [],
    });
    await expect(
      history.getRecordingAudioFile("recording-1"),
    ).resolves.toBeNull();
    await expect(history.getRecordingAudioFile("recording-1")).resolves.toBe(
      `file://${path.join(recordingsFolder, "recording-1", "recording.mp3")}`,
    );
  });

  it("updates recording metadata and invalidates both list and item queries", async () => {
    readJsonMock.mockResolvedValue({
      started: "2024-01-01T01:00:00.000Z",
      name: "Original",
      notes: "before",
    });

    const history = await import("./history");

    await history.updateRecording("recording-1", {
      name: "Renamed",
      notes: "after",
    });

    expect(writeJsonMock).toHaveBeenCalledWith(
      path.join(recordingsFolder, "recording-1", "meta.json"),
      {
        started: "2024-01-01T01:00:00.000Z",
        name: "Renamed",
        notes: "after",
      },
      { spaces: 2 },
    );
    expect(updateRecordingNameMock).toHaveBeenCalledWith(
      "recording-1",
      "Renamed",
    );
    expect(invalidateUiKeysMock).toHaveBeenNthCalledWith(
      1,
      QueryKeys.History,
      "recording-1",
    );
    expect(invalidateUiKeysMock).toHaveBeenNthCalledWith(2, QueryKeys.History);
  });

  it("opens and removes recording folders", async () => {
    const history = await import("./history");

    await history.openRecordingFolder("recording-1");
    await history.removeRecording("recording-1");

    expect(openPathMock).toHaveBeenCalledWith(
      path.join(recordingsFolder, "recording-1"),
    );
    expect(removeMock).toHaveBeenCalledWith(
      path.join(recordingsFolder, "recording-1"),
    );
    expect(removeRecordingFromIndexMock).toHaveBeenCalledWith("recording-1");
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.History);
  });
});
