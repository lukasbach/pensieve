import { QueryKeys } from "../../query-keys";

const {
  appGetPathMock,
  ensureDirMock,
  existsSyncMock,
  invalidateUiKeysMock,
  readJSONMock,
  removeMock,
  writeFileMock,
  writeJSONMock,
} = vi.hoisted(() => ({
  appGetPathMock: vi.fn(),
  ensureDirMock: vi.fn(),
  existsSyncMock: vi.fn(),
  invalidateUiKeysMock: vi.fn(),
  readJSONMock: vi.fn(),
  removeMock: vi.fn(),
  writeFileMock: vi.fn(),
  writeJSONMock: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getPath: appGetPathMock },
}));

vi.mock("fs-extra", () => ({
  default: {
    ensureDir: ensureDirMock,
    existsSync: existsSyncMock,
    readJSON: readJSONMock,
    remove: removeMock,
    writeJSON: writeJSONMock,
    promises: {
      writeFile: writeFileMock,
    },
  },
}));

vi.mock("../ipc/invalidate-ui", () => ({
  invalidateUiKeys: invalidateUiKeysMock,
}));

describe("settings", () => {
  beforeEach(() => {
    vi.resetModules();
    appGetPathMock.mockReset();
    ensureDirMock.mockReset();
    existsSyncMock.mockReset();
    invalidateUiKeysMock.mockReset();
    readJSONMock.mockReset();
    removeMock.mockReset();
    writeFileMock.mockReset();
    writeJSONMock.mockReset();
    appGetPathMock.mockReturnValue(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve",
    );
  });

  it("creates the settings file on first run", async () => {
    existsSyncMock.mockReturnValue(false);

    const settings = await import("./settings");

    await settings.initSettingsFile();

    expect(writeFileMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\settings.json",
      "{}",
      { encoding: "utf-8" },
    );
  });

  it("merges saved settings with defaults and caches the result", async () => {
    existsSyncMock.mockReturnValue(true);
    readJSONMock.mockResolvedValue({
      ui: { dark: false },
      whisper: { threads: 8 },
    });

    const settings = await import("./settings");
    const firstRead = await settings.getSettings();
    const secondRead = await settings.getSettings();

    expect(firstRead.ui.dark).toBe(false);
    expect(firstRead.whisper.threads).toBe(8);
    expect(firstRead.llm.provider).toBe("ollama");
    expect(secondRead).toBe(firstRead);
    expect(readJSONMock).toHaveBeenCalledTimes(1);
  });

  it("persists partial settings updates and invalidates affected queries", async () => {
    existsSyncMock.mockReturnValue(true);
    readJSONMock.mockResolvedValue({
      core: { recordingsFolder: "C:\\Existing" },
      ui: { dark: true },
    });

    const settings = await import("./settings");

    await settings.saveSettings({
      core: { recordingsFolder: "C:\\Updated" },
      ui: { dark: false },
    });

    expect(ensureDirMock).toHaveBeenCalledWith("C:\\Updated");
    expect(writeJSONMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\settings.json",
      expect.objectContaining({
        core: { recordingsFolder: "C:\\Updated" },
        ui: { dark: false },
      }),
      { spaces: 2 },
    );
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.Settings);
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.Theme);
  });

  it("removes the settings file during reset", async () => {
    const settings = await import("./settings");

    await settings.reset();

    expect(removeMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\settings.json",
    );
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.Settings);
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.Theme);
  });
});
