import { QueryKeys } from "../../query-keys";

const {
  closeRecorderOverlayWindowMock,
  getMainWindowMock,
  invalidateUiKeysMock,
  isMainWindowOpenMock,
  isRecorderOverlayOpenMock,
  openRecorderOverlayWindowMock,
  sendMock,
} = vi.hoisted(() => ({
  closeRecorderOverlayWindowMock: vi.fn(),
  getMainWindowMock: vi.fn(),
  invalidateUiKeysMock: vi.fn(),
  isMainWindowOpenMock: vi.fn(),
  isRecorderOverlayOpenMock: vi.fn(),
  openRecorderOverlayWindowMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("../ipc/invalidate-ui", () => ({
  invalidateUiKeys: invalidateUiKeysMock,
}));

vi.mock("./windows", () => ({
  closeRecorderOverlayWindow: closeRecorderOverlayWindowMock,
  getMainWindow: getMainWindowMock,
  isMainWindowOpen: isMainWindowOpenMock,
  isRecorderOverlayOpen: isRecorderOverlayOpenMock,
  openRecorderOverlayWindow: openRecorderOverlayWindowMock,
}));

describe("recorder-ipc", () => {
  beforeEach(() => {
    vi.resetModules();
    closeRecorderOverlayWindowMock.mockReset();
    getMainWindowMock.mockReset();
    invalidateUiKeysMock.mockReset();
    isMainWindowOpenMock.mockReset();
    isRecorderOverlayOpenMock.mockReset();
    openRecorderOverlayWindowMock.mockReset();
    sendMock.mockReset();
    getMainWindowMock.mockReturnValue({ webContents: { send: sendMock } });
    isMainWindowOpenMock.mockReturnValue(false);
    isRecorderOverlayOpenMock.mockReturnValue(false);
  });

  it("opens the recorder overlay when recording starts without a main window", async () => {
    const recorderIpc = await import("./recorder-ipc");

    recorderIpc.setState({ isRecording: true });

    expect(openRecorderOverlayWindowMock).toHaveBeenCalledTimes(1);
    expect(openRecorderOverlayWindowMock).toHaveBeenCalledWith(undefined);
    expect(recorderIpc.getState()).toMatchObject({
      isPaused: false,
      isRecording: true,
      meta: undefined,
    });
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(
      QueryKeys.RecorderIpcState,
    );
  });

  it("closes the recorder overlay when recording stops", async () => {
    const recorderIpc = await import("./recorder-ipc");

    recorderIpc.setState({ isRecording: true });
    closeRecorderOverlayWindowMock.mockReset();
    isRecorderOverlayOpenMock.mockReturnValue(true);

    recorderIpc.setState({ isRecording: false });

    expect(closeRecorderOverlayWindowMock).toHaveBeenCalledTimes(1);
    expect(recorderIpc.getState().isRecording).toBe(false);
  });

  it("passes the recording overlay preference when recording starts", async () => {
    const recorderIpc = await import("./recorder-ipc");

    recorderIpc.setState({ enableRecordingOverlay: false });
    openRecorderOverlayWindowMock.mockReset();

    recorderIpc.setState({ isRecording: true });

    expect(openRecorderOverlayWindowMock).toHaveBeenCalledWith(false);
    expect(recorderIpc.getState().enableRecordingOverlay).toBe(false);
  });

  it("merges partial state updates", async () => {
    const recorderIpc = await import("./recorder-ipc");

    recorderIpc.setState({
      isPaused: true,
      meta: { started: "2024-01-01T10:00:00.000Z", name: "Daily standup" },
    });

    expect(recorderIpc.getState()).toMatchObject({
      isPaused: true,
      meta: { started: "2024-01-01T10:00:00.000Z", name: "Daily standup" },
    });
  });

  it("clears explicitly undefined state values", async () => {
    const recorderIpc = await import("./recorder-ipc");

    recorderIpc.setState({
      enableRecordingOverlay: false,
      meta: { started: "2024-01-01T10:00:00.000Z", name: "Daily standup" },
    });
    recorderIpc.setState({ enableRecordingOverlay: undefined, meta: undefined });

    expect(recorderIpc.getState().enableRecordingOverlay).toBeUndefined();
    expect(recorderIpc.getState().meta).toBeUndefined();
  });

  it("forwards recorder events to the main window", async () => {
    const recorderIpc = await import("./recorder-ipc");

    await recorderIpc.sendEvent("setMeta", { name: "Renamed" });

    expect(sendMock).toHaveBeenCalledWith("recorderIpcEvent", {
      type: "setMeta",
      args: [{ name: "Renamed" }],
    });
  });
});
