export {};

const { createRendererIpcMock } = vi.hoisted(() => ({
  createRendererIpcMock: vi.fn((channel: string) => ({ channel })),
}));

vi.mock("./create-renderer-ipc", () => ({
  createRendererIpc: createRendererIpcMock,
}));

describe("renderer api", () => {
  beforeEach(() => {
    vi.resetModules();
    createRendererIpcMock.mockClear();
  });

  it("creates renderer ipc proxies for all exposed channels", async () => {
    const api = await import("./api");

    expect(createRendererIpcMock).toHaveBeenNthCalledWith(1, "main");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(2, "windows");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(3, "models");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(4, "history");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(5, "recorderIpc");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(6, "mcp");
    expect(createRendererIpcMock).toHaveBeenNthCalledWith(7, "chat");
    expect(api.mainApi).toEqual({ channel: "main" });
    expect(api.historyApi).toEqual({ channel: "history" });
    expect(api.mcpApi).toEqual({ channel: "mcp" });
    expect(api.chatApi).toEqual({ channel: "chat" });
  });
});
