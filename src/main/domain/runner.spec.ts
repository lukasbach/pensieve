export {};

const { execaMock, logInfoMock } = vi.hoisted(() => ({
  execaMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("execa", () => ({
  execa: execaMock,
}));

vi.mock("electron-log/main", () => ({
  default: { info: logInfoMock },
}));

describe("runner", () => {
  beforeEach(() => {
    vi.resetModules();
    execaMock.mockReset();
    logInfoMock.mockReset();
  });

  it("executes commands through execa and tracks them for cancellation", async () => {
    const firstProcess = { cancel: vi.fn() };
    const secondProcess = { cancel: vi.fn() };
    execaMock
      .mockReturnValueOnce(firstProcess)
      .mockReturnValueOnce(secondProcess);

    const runner = await import("./runner");

    expect(
      runner.execute("ffmpeg", ["-i", "input.webm"], { shell: false } as any),
    ).toBe(firstProcess as any);
    expect(runner.execute("whisper", ["input.wav"], undefined as any)).toBe(
      secondProcess as any,
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      "Running execa on ffmpeg, with args: [-i,input.webm]",
    );

    runner.abortAllExecutions();

    expect(firstProcess.cancel).toHaveBeenCalledTimes(1);
    expect(secondProcess.cancel).toHaveBeenCalledTimes(1);
  });
});
