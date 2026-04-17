import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HistoryItem } from "./history-item";
import { TestProvider } from "../test-provider";

const {
  addToPostProcessingQueueMock,
  openDialogMock,
  openRecordingDetailsWindowMock,
  openRecordingFolderMock,
  removeRecordingMock,
  startPostProcessingMock,
  updateRecordingMetaMock,
} = vi.hoisted(() => ({
  addToPostProcessingQueueMock: vi.fn(),
  openDialogMock: vi.fn(),
  openRecordingDetailsWindowMock: vi.fn(),
  openRecordingFolderMock: vi.fn(),
  removeRecordingMock: vi.fn(),
  startPostProcessingMock: vi.fn(),
  updateRecordingMetaMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    addToPostProcessingQueue: addToPostProcessingQueueMock,
    openRecordingDetailsWindow: openRecordingDetailsWindowMock,
    openRecordingFolder: openRecordingFolderMock,
    removeRecording: removeRecordingMock,
    startPostProcessing: startPostProcessingMock,
    updateRecordingMeta: updateRecordingMetaMock,
  },
  windowsApi: {
    openDialog: openDialogMock,
  },
}));

vi.mock("../dialog/context", () => ({
  useWindowedConfirm: () => vi.fn(),
  useWindowedPromptText: () => vi.fn(),
}));

describe("HistoryItem", () => {
  beforeEach(() => {
    addToPostProcessingQueueMock.mockReset();
    openDialogMock.mockReset();
    openRecordingDetailsWindowMock.mockReset();
    openRecordingFolderMock.mockReset();
    removeRecordingMock.mockReset();
    startPostProcessingMock.mockReset();
    updateRecordingMetaMock.mockReset();
  });

  it("renders recording tags and omits the old language badge", () => {
    render(
      <TestProvider>
        <HistoryItem
          id="rec-1"
          availableTags={[
            { name: "LongerTagName", color: "blue" },
            { name: "Hotfix", color: "red" },
            { name: "Support", color: "teal" },
            { name: "Ignored", color: "indigo" },
          ]}
          recording={{
            duration: 60000,
            isPostProcessed: true,
            language: "en",
            name: "Weekly review",
            started: "2024-01-02T09:00:00.000Z",
            tags: ["LongerTagName", "Hotfix", "Support", "Ignored"],
          }}
        />
      </TestProvider>,
    );

    expect(screen.getByText("LongerTa")).toBeInTheDocument();
    expect(screen.getByText("Hotfix")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
    expect(screen.queryByText("EN")).not.toBeInTheDocument();
  });

  it("opens the tag editor window and persists the returned tags", async () => {
    openDialogMock.mockResolvedValue(["Hotfix"]);

    render(
      <TestProvider>
        <HistoryItem
          id="rec-1"
          availableTags={[{ name: "Hotfix", color: "red" }]}
          recording={{
            duration: 60000,
            isPostProcessed: true,
            name: "Weekly review",
            started: "2024-01-02T09:00:00.000Z",
            tags: ["LongerTagName", "Hotfix"],
          }}
        />
      </TestProvider>,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Open recording actions" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /Edit tags/i }));

    expect(openDialogMock).toHaveBeenCalledWith(
      expect.stringMatching(/^edit-tags-rec-1-/),
      expect.objectContaining({
        defaultValue: ["LongerTagName", "Hotfix"],
        input: { label: "Tags", type: "tags" },
        title: "Edit tags",
      }),
    );
    await waitFor(() => {
      expect(updateRecordingMetaMock).toHaveBeenCalledWith("rec-1", {
        tags: ["Hotfix"],
      });
    });
  });
});