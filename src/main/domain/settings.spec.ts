import { QueryKeys } from "../../query-keys";

const {
  appGetPathMock,
  ensureDirMock,
  existsSyncMock,
  invalidateEmbeddingCacheMock,
  invalidateUiKeysMock,
  readJSONMock,
  removeMock,
  writeFileMock,
  writeJSONMock,
} = vi.hoisted(() => ({
  appGetPathMock: vi.fn(),
  ensureDirMock: vi.fn(),
  existsSyncMock: vi.fn(),
  invalidateEmbeddingCacheMock: vi.fn(),
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

vi.mock("./embedding-cache", () => ({
  embeddingCache: {
    invalidate: invalidateEmbeddingCacheMock,
  },
}));

describe("settings", () => {
  beforeEach(() => {
    vi.resetModules();
    appGetPathMock.mockReset();
    ensureDirMock.mockReset();
    existsSyncMock.mockReset();
    invalidateEmbeddingCacheMock.mockReset();
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
    expect(firstRead.ui.historyGroupBy).toBe("day");
    expect(firstRead.ui.recorderAdvancedSettingsOpen).toBe(false);
    expect(firstRead.whisper.threads).toBe(8);
    expect(firstRead.llm.provider).toBe("ollama");
    expect(firstRead.chat.enabled).toBe(false);
    expect(firstRead.chat.provider).toBe("ollama");
    expect(secondRead).toBe(firstRead);
    expect(readJSONMock).toHaveBeenCalledTimes(1);
  });

  it("migrates legacy provider config into shared provider settings", async () => {
    existsSyncMock.mockReturnValue(true);
    readJSONMock.mockResolvedValue({
      embeddings: {
        providerConfig: {
          ollama: { baseUrl: "http://legacy-ollama:11434", model: "embed-v1" },
          openai: {
            apiKey: "legacy-embedding-key",
            configuration: { baseURL: "https://legacy-openai.example.com/v1" },
            model: "embed-openai-v1",
            useCustomUrl: true,
          },
        },
      },
      llm: {
        providerConfig: {
          ollama: {
            chatModel: {
              baseUrl: "http://legacy-chat-ollama:11434",
              model: "legacy-chat-model",
            },
          },
          openai: {
            chatModel: {
              apiKey: "legacy-chat-key",
              configuration: { baseURL: "https://legacy-chat.example.com/v1" },
              model: "legacy-gpt",
            },
            useCustomUrl: true,
          },
        },
      },
    });

    const settings = await import("./settings");
    const result = await settings.getSettings();

    expect(result.providers.ollama.baseUrl).toBe(
      "http://legacy-chat-ollama:11434",
    );
    expect(result.providers.openai.apiKey).toBe("legacy-chat-key");
    expect(result.providers.openai.useCustomUrl).toBe(true);
    expect(result.providers.openai.baseURL).toBe(
      "https://legacy-chat.example.com/v1",
    );
    expect(result.llm.models.ollama).toBe("legacy-chat-model");
    expect(result.llm.models.openai).toBe("legacy-gpt");
    expect(result.embeddings.models.ollama).toBe("embed-v1");
    expect(result.embeddings.models.openai).toBe("embed-openai-v1");
  });

  it("falls back chat provider and models to llm settings when missing", async () => {
    existsSyncMock.mockReturnValue(true);
    readJSONMock.mockResolvedValue({
      llm: {
        models: {
          ollama: "chat-ollama-model",
          openai: "chat-openai-model",
        },
        provider: "openai",
      },
    });

    const settings = await import("./settings");
    const result = await settings.getSettings();

    expect(result.chat.provider).toBe("openai");
    expect(result.chat.models.ollama).toBe("chat-ollama-model");
    expect(result.chat.models.openai).toBe("chat-openai-model");
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
      ui: { dark: false, recorderAdvancedSettingsOpen: true },
    });

    expect(ensureDirMock).toHaveBeenCalledWith("C:\\Updated");
    expect(writeJSONMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\settings.json",
      expect.objectContaining({
        core: { recordingsFolder: "C:\\Updated" },
        ui: expect.objectContaining({
          dark: false,
          historyGroupBy: "day",
          recorderAdvancedSettingsOpen: true,
        }),
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
