const { infoMock, openAppWindowMock, showMessageBoxMock } = vi.hoisted(() => ({
  infoMock: vi.fn(),
  openAppWindowMock: vi.fn(),
  showMessageBoxMock: vi.fn(),
}));

vi.mock("electron", () => ({
  BrowserWindow: {
    getFocusedWindow: vi.fn(),
  },
  dialog: {
    showMessageBox: showMessageBoxMock,
  },
}));

vi.mock("electron-log/main", () => ({
  default: { info: infoMock },
}));

vi.mock("./windows", () => ({
  openAppWindow: openAppWindowMock,
}));

describe("dialogs", () => {
  beforeEach(() => {
    vi.resetModules();
    infoMock.mockReset();
    openAppWindowMock.mockReset();
    showMessageBoxMock.mockReset();
  });

  it("creates dialogs and resolves them with submitted values", async () => {
    const closeMock = vi.fn();
    openAppWindowMock.mockReturnValue({ close: closeMock });

    const dialogs = await import("./dialogs");
    const promise = dialogs.createDialog("rename", {
      title: "Rename recording",
      content: "Enter a title",
    });

    expect(openAppWindowMock).toHaveBeenCalledWith(
      "/dialog",
      { dialogId: "rename" },
      expect.objectContaining({ width: 560, height: 160 }),
    );
    expect(dialogs.getDialogData("rename")).toEqual(
      expect.objectContaining({ title: "Rename recording" }),
    );
    expect(dialogs.getDialogWindow("rename")).toEqual(
      expect.objectContaining({ close: closeMock }),
    );

    dialogs.submitDialogData("rename", "Weekly sync");

    await expect(promise).resolves.toBe("Weekly sync");
    expect(infoMock).toHaveBeenCalledWith("submitDialogData: ", "Weekly sync");
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(dialogs.getDialogWindow("rename")).toBeUndefined();
  });

  it("resolves dialogs with null when closed", async () => {
    const closeMock = vi.fn();
    openAppWindowMock.mockReturnValue({ close: closeMock });

    const dialogs = await import("./dialogs");
    const promise = dialogs.createDialog("confirm", {
      title: "Delete recording",
    });

    dialogs.closeDialog("confirm");

    await expect(promise).resolves.toBeNull();
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(dialogs.getDialogWindow("confirm")).toBeUndefined();
  });

  it("returns true when the confirmation dialog is accepted", async () => {
    showMessageBoxMock.mockResolvedValue({ response: 1 });

    const dialogs = await import("./dialogs");
    await expect(
      dialogs.confirmDialog(
        "End recording now?",
        "Stop and save the recording now?",
        "Yes, stop and save",
        "No, keep recording",
      ),
    ).resolves.toBe(true);

    expect(showMessageBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: ["No, keep recording", "Yes, stop and save"],
        message: "End recording now?",
        detail: "Stop and save the recording now?",
      }),
    );
  });

  it("returns false when the confirmation dialog is dismissed", async () => {
    showMessageBoxMock.mockResolvedValue({ response: 0 });

    const dialogs = await import("./dialogs");
    await expect(
      dialogs.confirmDialog("End recording now?", "Stop and save?"),
    ).resolves.toBe(false);
  });
});
