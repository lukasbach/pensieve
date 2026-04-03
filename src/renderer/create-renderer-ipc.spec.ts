import { createRendererIpc } from "./create-renderer-ipc";

describe("create-renderer-ipc", () => {
  it("forwards method calls through the preload bridge", async () => {
    const invokeMock = vi.fn().mockResolvedValue({ ok: true });
    (window as any).ipcApi.history = { invoke: invokeMock };

    const api = createRendererIpc<{
      openRecording: (
        recordingId: string,
        highlightedLine?: number,
      ) => Promise<{
        ok: boolean;
      }>;
    }>("history");

    await expect(api.openRecording("recording-1", 12)).resolves.toEqual({
      ok: true,
    });
    expect(invokeMock).toHaveBeenCalledWith({
      eventName: "openRecording",
      args: ["recording-1", 12],
    });
  });
});
