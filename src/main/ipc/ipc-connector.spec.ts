export {};

const { handleMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: handleMock },
}));

describe("ipc-connector", () => {
  beforeEach(() => {
    vi.resetModules();
    handleMock.mockReset();
  });

  it("registers an ipc handler and forwards event payloads", async () => {
    const { loadIpcInterfaceInMain } = await import("./ipc-connector");
    const getSettingsMock = vi.fn().mockResolvedValue({ ok: true });

    loadIpcInterfaceInMain("main", {
      getSettings: getSettingsMock,
    });

    expect(handleMock).toHaveBeenCalledWith("main", expect.any(Function));

    const handler = handleMock.mock.calls[0][1];
    await expect(
      handler({}, { eventName: "getSettings", args: ["theme"] }),
    ).resolves.toEqual({ ok: true });
    expect(getSettingsMock).toHaveBeenCalledWith("theme");
  });
});
