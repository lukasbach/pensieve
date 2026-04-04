import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatRichContent } from "./chat-rich-content";
import { TestProvider } from "../test-provider";

export {};

const {
  getRecordingMetaMock,
  getRecordingTranscriptMock,
  openRecordingDetailsWindowMock,
} = vi.hoisted(() => ({
  getRecordingMetaMock: vi.fn(),
  getRecordingTranscriptMock: vi.fn(),
  openRecordingDetailsWindowMock: vi.fn(),
}));

vi.mock("../api", () => ({
  historyApi: {
    getRecordingMeta: getRecordingMetaMock,
    getRecordingTranscript: getRecordingTranscriptMock,
    openRecordingDetailsWindow: openRecordingDetailsWindowMock,
  },
}));

describe("ChatRichContent", () => {
  beforeEach(() => {
    getRecordingMetaMock.mockReset();
    getRecordingTranscriptMock.mockReset();
    openRecordingDetailsWindowMock.mockReset();
  });

  it("renders recording cards with transcript snippets", async () => {
    getRecordingMetaMock.mockResolvedValue({
      name: "Roadmap Review",
      started: "2026-04-04T10:00:00.000Z",
    });
    getRecordingTranscriptMock.mockResolvedValue({
      result: { language: "en" },
      transcription: [
        {
          offsets: { from: 0, to: 1000 },
          speaker: "Alice",
          text: "Kickoff context.",
          timestamps: { from: "00:00", to: "00:01" },
        },
        {
          offsets: { from: 0, to: 1000 },
          speaker: "Alice",
          text: "We reviewed the launch blockers.",
          timestamps: { from: "00:01", to: "00:02" },
        },
        {
          offsets: { from: 1000, to: 2000 },
          speaker: "Alice",
          text: "The roadmap moved into July.",
          timestamps: { from: "00:02", to: "00:03" },
        },
        {
          offsets: { from: 2000, to: 3000 },
          speaker: "Bob",
          text: "Action items were assigned.",
          timestamps: { from: "00:03", to: "00:04" },
        },
        {
          speaker: "Alice",
          offsets: { from: 3000, to: 4000 },
          text: "Budget questions were deferred.",
          timestamps: { from: "00:04", to: "00:05" },
        },
      ],
    });

    render(
      <TestProvider>
        <ChatRichContent
          content={'Take a look at this recording.\n\n<recording id="rec-1" highlightedLine="3"/>'}
        />
      </TestProvider>,
    );

    expect(await screen.findByText("Roadmap Review")).toBeInTheDocument();
    expect(
      screen.getByText("We reviewed the launch blockers."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The roadmap moved into July."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Action items were assigned."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kickoff context.")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Budget questions were deferred."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^Line 3$/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open transcript line 3 in Roadmap Review",
      }),
    );

    await waitFor(() => {
      expect(openRecordingDetailsWindowMock).toHaveBeenCalledWith("rec-1", 3);
    });
  });

  it("renders clickable transcript line cards", async () => {
    getRecordingMetaMock.mockResolvedValue({
      name: "Planning Sync",
      started: "2026-04-04T11:00:00.000Z",
    });
    getRecordingTranscriptMock.mockResolvedValue({
      result: { language: "en" },
      transcription: [
        {
          offsets: { from: 0, to: 1000 },
          speaker: "Alice",
          text: "Introductions.",
          timestamps: { from: "00:00", to: "00:01" },
        },
        {
          offsets: { from: 1000, to: 2000 },
          speaker: "Bob",
          text: "We discussed the hiring plan.",
          timestamps: { from: "00:01", to: "00:02" },
        },
        {
          offsets: { from: 2000, to: 3000 },
          speaker: "Cara",
          text: "Budget approval is pending.",
          timestamps: { from: "00:02", to: "00:03" },
        },
      ],
    });

    render(
      <TestProvider>
        <ChatRichContent
          content={'Relevant excerpt:\n\n<recording-lines id="rec-2" startLine="2" length="2"/>'}
        />
      </TestProvider>,
    );

    expect(await screen.findByText("Planning Sync")).toBeInTheDocument();
    expect(
      screen.getByText("We discussed the hiring plan."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Budget approval is pending."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open transcript line 3 in Planning Sync",
      }),
    );

    await waitFor(() => {
      expect(openRecordingDetailsWindowMock).toHaveBeenCalledWith("rec-2", 3);
    });
  });
});