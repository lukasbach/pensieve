export {};

const {
  TrayMock,
  buildFromTemplateMock,
  exitMock,
  getIconPathMock,
  onMock,
  openMainWindowAsTrayMock,
  openMainWindowNormallyMock,
  openSettingsWindowMock,
  setContextMenuMock,
} = vi.hoisted(() => {
  const setContextMenuMock = vi.fn();
  const onMock = vi.fn();
  const TrayMock = vi.fn(function Tray() {
    return {
      on: onMock,
      setContextMenu: setContextMenuMock,
    };
  });

  return {
    TrayMock,
    buildFromTemplateMock: vi.fn(),
    exitMock: vi.fn(),
    getIconPathMock: vi.fn(),
    onMock,
    openMainWindowAsTrayMock: vi.fn(),
    openMainWindowNormallyMock: vi.fn(),
    openSettingsWindowMock: vi.fn(),
    setContextMenuMock,
  };
});

vi.mock("electron", () => ({
  Menu: { buildFromTemplate: buildFromTemplateMock },
  Tray: TrayMock,
  app: { exit: exitMock },
}));

vi.mock("../../main-utils", () => ({
  getIconPath: getIconPathMock,
}));

vi.mock("./windows", () => ({
  openMainWindowAsTray: openMainWindowAsTrayMock,
  openMainWindowNormally: openMainWindowNormallyMock,
}));

vi.mock("../ipc/windows-api", () => ({
  windowsApi: {
    openSettingsWindow: openSettingsWindowMock,
  },
}));

describe("tray", () => {
  beforeEach(() => {
    vi.resetModules();
    TrayMock.mockClear();
    buildFromTemplateMock.mockReset();
    exitMock.mockReset();
    getIconPathMock.mockReset();
    onMock.mockReset();
    openMainWindowAsTrayMock.mockReset();
    openMainWindowNormallyMock.mockReset();
    openSettingsWindowMock.mockReset();
    setContextMenuMock.mockReset();
  });

  it("registers the tray icon, menu items, and click handlers", async () => {
    const menu = { id: "context-menu" };
    let template: any[] = [];
    getIconPathMock.mockReturnValue("C:\\Pensieve\\icon.png");
    buildFromTemplateMock.mockImplementation((items: any[]) => {
      template = items;
      return menu;
    });

    const tray = await import("./tray");

    tray.registerTray();

    expect(TrayMock).toHaveBeenCalledWith("C:\\Pensieve\\icon.png");
    expect(setContextMenuMock).toHaveBeenCalledWith(menu);
    expect(onMock).toHaveBeenNthCalledWith(
      1,
      "click",
      openMainWindowAsTrayMock,
    );
    expect(onMock).toHaveBeenNthCalledWith(
      2,
      "double-click",
      openMainWindowNormallyMock,
    );

    template[0].click();
    template[1].click();
    template[2].click();

    expect(openMainWindowNormallyMock).toHaveBeenCalledTimes(1);
    expect(openSettingsWindowMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(0);
  });
});
