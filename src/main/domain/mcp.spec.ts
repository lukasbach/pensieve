export {};

const {
  closeMock,
  createServerMock,
  getSettingsMock,
  invalidateUiKeysMock,
  listenMock,
  mcpToolsMock,
  onceMock,
} = vi.hoisted(() => ({
  closeMock: vi.fn((callback?: (error?: Error) => void) => callback?.()),
  createServerMock: vi.fn(),
  getSettingsMock: vi.fn(),
  invalidateUiKeysMock: vi.fn(),
  listenMock: vi.fn((_port: number, _host: string, callback?: () => void) =>
    callback?.(),
  ),
  mcpToolsMock: {
    getRecordingDetails: vi.fn(),
    openRecording: vi.fn(),
    queryRecordings: vi.fn(),
    readTranscript: vi.fn(),
  },
  onceMock: vi.fn(),
}));

vi.mock("http", () => ({
  default: {
    createServer: createServerMock,
  },
}));

vi.mock("electron-log/main", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./mcp-tools", () => ({
  mcpTools: mcpToolsMock,
}));

vi.mock("../ipc/invalidate-ui", () => ({
  invalidateUiKeys: invalidateUiKeysMock,
}));

describe("mcpServer", () => {
  beforeEach(() => {
    vi.resetModules();
    closeMock.mockReset();
    createServerMock.mockReset();
    getSettingsMock.mockReset();
    invalidateUiKeysMock.mockReset();
    listenMock.mockReset();
    mcpToolsMock.getRecordingDetails.mockReset();
    mcpToolsMock.openRecording.mockReset();
    mcpToolsMock.queryRecordings.mockReset();
    mcpToolsMock.readTranscript.mockReset();
    onceMock.mockReset();
    listenMock.mockImplementation(
      (_port: number, _host: string, callback?: () => void) => callback?.(),
    );
    closeMock.mockImplementation((callback?: (error?: Error) => void) =>
      callback?.(),
    );
    createServerMock.mockReturnValue({
      close: closeMock,
      listen: listenMock,
      once: onceMock,
    });
  });

  it("starts the configured server and reports status", async () => {
    getSettingsMock.mockResolvedValue({
      mcp: { enabled: true, port: 4100 },
    });

    const { mcpServer } = await import("./mcp");

    await mcpServer.syncFromSettings();

    expect(createServerMock).toHaveBeenCalledTimes(1);
    expect(listenMock).toHaveBeenCalledWith(
      4100,
      "127.0.0.1",
      expect.any(Function),
    );
    expect(mcpServer.getStatus()).toEqual({
      enabled: true,
      endpoint: "http://127.0.0.1:4100/mcp",
      error: null,
      port: 4100,
      running: true,
    });
  });

  it("stops the server when MCP is disabled", async () => {
    getSettingsMock
      .mockResolvedValueOnce({ mcp: { enabled: true, port: 4100 } })
      .mockResolvedValueOnce({ mcp: { enabled: false, port: 4100 } });

    const { mcpServer } = await import("./mcp");

    await mcpServer.syncFromSettings();
    await mcpServer.syncFromSettings();

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(mcpServer.getStatus()).toEqual({
      enabled: false,
      endpoint: "http://127.0.0.1:4100/mcp",
      error: null,
      port: 4100,
      running: false,
    });
    expect(invalidateUiKeysMock).toHaveBeenCalled();
  });
});
