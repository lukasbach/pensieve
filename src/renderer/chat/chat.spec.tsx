import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Chat } from "./chat";
import { TestProvider } from "../test-provider";
import { SettingsTab } from "../settings/tabs";

export {};

const {
  disposeSessionMock,
  getSettingsMock,
  listSessionsMock,
  loadSessionMock,
  openSettingsWindowMock,
  resetSessionMock,
  sendMessageMock,
} = vi.hoisted(() => ({
  disposeSessionMock: vi.fn(),
  getSettingsMock: vi.fn(),
  listSessionsMock: vi.fn(),
  loadSessionMock: vi.fn(),
  openSettingsWindowMock: vi.fn(),
  resetSessionMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock("../api", () => ({
  chatApi: {
    disposeSession: disposeSessionMock,
    listSessions: listSessionsMock,
    loadSession: loadSessionMock,
    resetSession: resetSessionMock,
    sendMessage: sendMessageMock,
  },
  mainApi: {
    getSettings: getSettingsMock,
  },
  windowsApi: {
    openSettingsWindow: openSettingsWindowMock,
  },
}));

describe("Chat", () => {
  beforeEach(() => {
    disposeSessionMock.mockReset();
    getSettingsMock.mockReset();
    listSessionsMock.mockReset();
    loadSessionMock.mockReset();
    openSettingsWindowMock.mockReset();
    resetSessionMock.mockReset();
    sendMessageMock.mockReset();
    listSessionsMock.mockResolvedValue([]);
  });

  it("shows the setup empty state when chat is disabled", async () => {
    getSettingsMock.mockResolvedValue({
      chat: { enabled: false },
    });

    render(
      <TestProvider>
        <Chat />
      </TestProvider>,
    );

    expect(await screen.findByText("Chat is not enabled")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open chat settings" }));

    expect(openSettingsWindowMock).toHaveBeenCalledWith(SettingsTab.Chat);
  });

  it("sends messages and renders the assistant reply", async () => {
    getSettingsMock.mockResolvedValue({
      chat: { enabled: true, provider: "openai" },
    });
    sendMessageMock.mockResolvedValue({
      content: "I found two recordings that mention the roadmap.",
    });

    render(
      <TestProvider>
        <Chat />
      </TestProvider>,
    );

    await screen.findByText("Ask about decisions, topics, and follow-ups.");

    fireEvent.change(screen.getByRole("textbox", { name: "Chat message" }), {
      target: { value: "Find meetings about the roadmap" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      screen.getByText("Find meetings about the roadmap"),
    ).toBeInTheDocument();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByText("I found two recordings that mention the roadmap."),
      ).toBeInTheDocument();
    });
  });

  it("renders the chat history button when chat is enabled", async () => {
    getSettingsMock.mockResolvedValue({
      chat: { enabled: true, provider: "openai" },
    });
    listSessionsMock.mockResolvedValue([
      {
        createdAt: "2026-04-04T10:00:00.000Z",
        messageCount: 2,
        sessionId: "session-1",
        title: "Roadmap follow-up",
        updatedAt: "2026-04-04T10:05:00.000Z",
      },
    ]);
    loadSessionMock.mockResolvedValue({
      createdAt: "2026-04-04T10:00:00.000Z",
      messages: [
        {
          content: "What changed in the roadmap?",
          id: "user-1",
          role: "user",
        },
        {
          content: "The roadmap added hiring and launch milestones.",
          id: "assistant-1",
          role: "assistant",
        },
      ],
      sessionId: "session-1",
      title: "Roadmap follow-up",
      updatedAt: "2026-04-04T10:05:00.000Z",
    });

    render(
      <TestProvider>
        <Chat />
      </TestProvider>,
    );

    expect(
      await screen.findByRole("button", { name: "Open chat history" }),
    ).toBeInTheDocument();
    expect(listSessionsMock).toHaveBeenCalledTimes(1);
    expect(loadSessionMock).not.toHaveBeenCalled();
  });
});
