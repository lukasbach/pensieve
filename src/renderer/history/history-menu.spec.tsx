import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HistoryMenu } from "./history-menu";
import { TestProvider } from "../test-provider";

const {
  addToPostProcessingQueueMock,
  getPostProcessingProgressMock,
  importRecordingMock,
  saveSettingsMock,
  showOpenImportDialogMock,
  startPostProcessingMock,
} = vi.hoisted(() => ({
  addToPostProcessingQueueMock: vi.fn(),
  getPostProcessingProgressMock: vi.fn(),
  importRecordingMock: vi.fn(),
  saveSettingsMock: vi.fn(),
  showOpenImportDialogMock: vi.fn(),
  startPostProcessingMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    addToPostProcessingQueue: addToPostProcessingQueueMock,
    getPostProcessingProgress: getPostProcessingProgressMock,
    importRecording: importRecordingMock,
    showOpenImportDialog: showOpenImportDialogMock,
    startPostProcessing: startPostProcessingMock,
  },
}));

vi.mock("../common/use-settings", () => ({
  useSettings: () => ({
    saveSettings: saveSettingsMock,
    settings: {
      datahooks: { enabled: false },
      embeddings: { enabled: false },
      ui: { historyItemDetails: "summaryOrDuration" },
    },
  }),
}));

vi.mock("../dialog/context", () => ({
  useWindowedPromptText: () => vi.fn(),
}));

vi.mock("./state", () => ({
  useHistoryRecordings: () => ({ data: {} }),
}));

describe("HistoryMenu", () => {
  beforeEach(() => {
    addToPostProcessingQueueMock.mockReset();
    getPostProcessingProgressMock.mockReset();
    importRecordingMock.mockReset();
    saveSettingsMock.mockReset();
    showOpenImportDialogMock.mockReset();
    startPostProcessingMock.mockReset();

    getPostProcessingProgressMock.mockResolvedValue({ processingQueue: [] });
  });

  it("persists the selected item details mode", async () => {
    render(
      <TestProvider>
        <HistoryMenu
          availableTags={[]}
          search={{
            historyFilter: "all",
            historyGroupBy: "day",
            setHistoryFilter: vi.fn(),
            setHistoryGroupBy: vi.fn(),
            tagFilters: [],
            toggleTagFilter: vi.fn(),
          }}
        />
      </TestProvider>,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Open history options" }),
    );

    const itemDetailsTrigger = await screen.findByRole("menuitem", {
      name: /Item Details/i,
    });

    fireEvent.pointerMove(itemDetailsTrigger);
    fireEvent.keyDown(itemDetailsTrigger, { key: "ArrowRight" });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Technical details/i }),
    );

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalledWith({
        ui: { historyItemDetails: "technicalDetails" },
      });
    });

    expect(
      screen.getByRole("menuitem", { name: /Summary or duration/i }),
    ).toBeInTheDocument();
  });
});
