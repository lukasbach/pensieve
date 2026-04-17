import { render, screen } from "@testing-library/react";
import { History } from "./history";
import { TestProvider } from "../test-provider";

const {
  getPostProcessingProgressMock,
  getRecordingsMock,
  getSettingsMock,
  promptTextMock,
} = vi.hoisted(() => ({
  getPostProcessingProgressMock: vi.fn(),
  getRecordingsMock: vi.fn(),
  getSettingsMock: vi.fn(),
  promptTextMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    getPostProcessingProgress: getPostProcessingProgressMock,
    getRecordings: getRecordingsMock,
  },
  mainApi: {
    getSettings: getSettingsMock,
  },
}));

vi.mock("../dialog/context", () => ({
  useWindowedPromptText: () => promptTextMock,
}));

describe("History", () => {
  beforeEach(() => {
    getPostProcessingProgressMock.mockReset();
    getRecordingsMock.mockReset();
    getSettingsMock.mockReset();
    promptTextMock.mockReset();

    getPostProcessingProgressMock.mockResolvedValue({ processingQueue: [] });
    getRecordingsMock.mockResolvedValue({});
  });

  it("renders when settings omit optional feature sections", async () => {
    getSettingsMock.mockResolvedValue({});

    render(
      <TestProvider>
        <History />
      </TestProvider>,
    );

    expect(await screen.findByText("No recordings yet")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search recordings...")).toBeVisible();
  });
});