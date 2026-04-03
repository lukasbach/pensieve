export {};

const { getAllDisplaysMock, getSourcesMock, openAppWindowMock } = vi.hoisted(
  () => ({
    getAllDisplaysMock: vi.fn(),
    getSourcesMock: vi.fn(),
    openAppWindowMock: vi.fn(),
  }),
);

vi.mock("electron", () => ({
  default: {
    desktopCapturer: { getSources: getSourcesMock },
    screen: { getAllDisplays: getAllDisplaysMock },
  },
}));

vi.mock("./windows", () => ({
  openAppWindow: openAppWindowMock,
}));

describe("screenshot", () => {
  beforeEach(() => {
    vi.resetModules();
    getAllDisplaysMock.mockReset();
    getSourcesMock.mockReset();
    openAppWindowMock.mockReset();
  });

  it("opens screenshot windows and resolves the selected area", async () => {
    const closeFirstMock = vi.fn();
    const closeSecondMock = vi.fn();
    getAllDisplaysMock.mockReturnValue([
      { id: 1, bounds: { x: 0, y: 0, width: 100, height: 80 } },
      { id: 2, bounds: { x: 100, y: 0, width: 120, height: 90 } },
    ]);
    getSourcesMock.mockResolvedValue([
      { display_id: "1", id: "screen:1" },
      { display_id: "2", id: "screen:2" },
    ]);
    openAppWindowMock
      .mockReturnValueOnce({ close: closeFirstMock })
      .mockReturnValueOnce({ close: closeSecondMock });

    const screenshot = await import("./screenshot");
    const promise = screenshot.requestScreenshot();
    const area = { displayId: "screen:1", x: 1, y: 2, width: 3, height: 4 };

    await Promise.resolve();
    await screenshot.completeScreenshot(area);

    await expect(promise).resolves.toEqual(area);
    expect(openAppWindowMock).toHaveBeenNthCalledWith(
      1,
      "/screenshot",
      { displayId: "screen:1" },
      expect.objectContaining({ x: 0, y: 0, width: 100, height: 80 }),
    );
    expect(openAppWindowMock).toHaveBeenNthCalledWith(
      2,
      "/screenshot",
      { displayId: "screen:2" },
      expect.objectContaining({ x: 100, y: 0, width: 120, height: 90 }),
    );
    expect(closeFirstMock).toHaveBeenCalledTimes(1);
    expect(closeSecondMock).toHaveBeenCalledTimes(1);
  });

  it("returns null when screenshot capture is aborted", async () => {
    const closeMock = vi.fn();
    getAllDisplaysMock.mockReturnValue([
      { id: 1, bounds: { x: 0, y: 0, width: 100, height: 80 } },
    ]);
    getSourcesMock.mockResolvedValue([{ display_id: "1", id: "screen:1" }]);
    openAppWindowMock.mockReturnValue({ close: closeMock });

    const screenshot = await import("./screenshot");
    const promise = screenshot.requestScreenshot();

    await Promise.resolve();
    await screenshot.abortScreenshot();

    await expect(promise).resolves.toBeNull();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
