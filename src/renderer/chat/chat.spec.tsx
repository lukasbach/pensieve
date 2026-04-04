export {};

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Chat } from "./chat";
import { TestProvider } from "../test-provider";
import { SettingsTab } from "../settings/tabs";

const {
  disposeSessionMock,
  getSettingsMock,
  openSettingsWindowMock,
  resetSessionMock,
  sendMessageMock,
} = vi.hoisted(() => ({
  disposeSessionMock: vi.fn(),
  getSettingsMock: vi.fn(),
  openSettingsWindowMock: vi.fn(),
  resetSessionMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock("../api", () => ({
  chatApi: {
    disposeSession: disposeSessionMock,
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
    openSettingsWindowMock.mockReset();
    resetSessionMock.mockReset();
    sendMessageMock.mockReset();
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

    expect(screen.getByText("Find meetings about the roadmap")).toBeInTheDocument();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByText("I found two recordings that mention the roadmap."),
      ).toBeInTheDocument();
    });
  });
});