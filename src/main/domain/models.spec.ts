export {};

const {
  appGetPathMock,
  createWriteStreamMock,
  ensureDirMock,
  pathExistsMock,
  readdirMock,
  setProgressMock,
  setStepMock,
  writeStreamCloseMock,
  writeStreamOnMock,
  httpsGetMock,
  getSettingsMock,
  logInfoMock,
  logErrorMock,
} = vi.hoisted(() => ({
  appGetPathMock: vi.fn(),
  createWriteStreamMock: vi.fn(),
  ensureDirMock: vi.fn(),
  pathExistsMock: vi.fn(),
  readdirMock: vi.fn(),
  setProgressMock: vi.fn(),
  setStepMock: vi.fn(),
  writeStreamCloseMock: vi.fn(),
  writeStreamOnMock: vi.fn(),
  httpsGetMock: vi.fn(),
  getSettingsMock: vi.fn(),
  logInfoMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getPath: appGetPathMock },
}));

vi.mock("fs-extra", () => ({
  default: {
    ensureDir: ensureDirMock,
    createWriteStream: createWriteStreamMock,
    pathExists: pathExistsMock,
    readdir: readdirMock,
    unlink: vi.fn(),
  },
}));

vi.mock("follow-redirects", () => ({
  https: { get: httpsGetMock },
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./postprocess", () => ({
  setProgress: setProgressMock,
  setStep: setStepMock,
}));

vi.mock("electron-log/main", () => ({
  default: {
    info: logInfoMock,
    error: logErrorMock,
  },
}));

describe("models", () => {
  beforeEach(() => {
    vi.resetModules();
    appGetPathMock.mockReset();
    createWriteStreamMock.mockReset();
    ensureDirMock.mockReset();
    pathExistsMock.mockReset();
    readdirMock.mockReset();
    setProgressMock.mockReset();
    setStepMock.mockReset();
    writeStreamCloseMock.mockReset();
    writeStreamOnMock.mockReset();
    httpsGetMock.mockReset();
    getSettingsMock.mockReset();
    logInfoMock.mockReset();
    logErrorMock.mockReset();

    appGetPathMock.mockReturnValue(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve",
    );
    createWriteStreamMock.mockReturnValue({
      on: writeStreamOnMock,
      close: writeStreamCloseMock,
    });
    writeStreamOnMock.mockImplementation(
      (event: string, callback: () => void) => {
        if (event === "finish") {
          callback();
        }
        return { on: writeStreamOnMock, close: writeStreamCloseMock };
      },
    );
    getSettingsMock.mockResolvedValue({
      whisper: { model: "ggml-base-q5_1" },
    });
  });

  it("validates model download urls", async () => {
    const models = await import("./models");

    expect(
      models.validateModelUrl(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin?download=true",
      ),
    ).toBe(true);
    expect(models.validateModelUrl("https://example.com/model.bin")).toBe(
      false,
    );
  });

  it("lists, resolves, and checks configured models", async () => {
    readdirMock.mockResolvedValue(["ggml-base-q5_1.bin"]);
    pathExistsMock.mockResolvedValue(true);

    const models = await import("./models");

    await expect(models.getModels()).resolves.toEqual(["ggml-base-q5_1.bin"]);
    await expect(models.hasModel("ggml-base-q5_1")).resolves.toBe(true);
    expect(models.getModelPath("ggml-base-q5_1")).toBe(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\models\\ggml-base-q5_1.bin",
    );
  });

  it("downloads a model and reports progress", async () => {
    httpsGetMock.mockImplementation(
      (url: string, callback: (res: any) => void) => {
        const dataListeners: Array<(chunk: { length: number }) => void> = [];
        const res: any = {
          headers: { "content-length": "4" },
          on: vi.fn(
            (event: string, listener: (chunk: { length: number }) => void) => {
              if (event === "data") {
                dataListeners.push(listener);
              }
              return res;
            },
          ),
          pipe: vi.fn(),
        };

        callback(res);
        dataListeners.forEach((listener) => listener({ length: 4 }));

        return { on: vi.fn() };
      },
    );

    const models = await import("./models");

    await expect(
      models.downloadModel(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin?download=true",
        "ggml-base-q5_1.bin",
      ),
    ).resolves.toBeUndefined();

    expect(ensureDirMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\models",
    );
    expect(createWriteStreamMock).toHaveBeenCalledWith(
      "C:\\Users\\tester\\AppData\\Roaming\\Pensieve\\models\\ggml-base-q5_1.bin",
    );
    expect(setProgressMock).toHaveBeenCalledWith("modelDownload", 1);
    expect(writeStreamCloseMock).toHaveBeenCalledTimes(1);
    expect(logInfoMock).toHaveBeenCalled();
  });

  it("rejects invalid download urls before any filesystem work", async () => {
    const models = await import("./models");

    await expect(
      models.downloadModel("https://example.com/model.bin", "bad.bin"),
    ).rejects.toThrow("Invalid model URL");
    expect(ensureDirMock).not.toHaveBeenCalled();
  });

  it("prepares the configured model and downloads it only when missing", async () => {
    httpsGetMock.mockImplementation(
      (url: string, callback: (res: any) => void) => {
        const dataListeners: Array<(chunk: { length: number }) => void> = [];
        const res: any = {
          headers: { "content-length": "4" },
          on: vi.fn(
            (event: string, listener: (chunk: { length: number }) => void) => {
              if (event === "data") {
                dataListeners.push(listener);
              }
              return res;
            },
          ),
          pipe: vi.fn(),
        };

        callback(res);
        dataListeners.forEach((listener) => listener({ length: 4 }));

        return { on: vi.fn() };
      },
    );
    pathExistsMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const models = await import("./models");

    await expect(models.prepareConfiguredModel()).resolves.toBe(
      "ggml-base-q5_1",
    );
    expect(setStepMock).toHaveBeenCalledWith("modelDownload");
    expect(setProgressMock).toHaveBeenLastCalledWith("modelDownload", 1);

    pathExistsMock.mockResolvedValue(true);
    setStepMock.mockReset();
    setProgressMock.mockReset();

    await expect(models.prepareConfiguredModel()).resolves.toBe(
      "ggml-base-q5_1",
    );
    expect(setStepMock).not.toHaveBeenCalled();
    expect(setProgressMock).toHaveBeenCalledWith("modelDownload", 1);
  });
});
