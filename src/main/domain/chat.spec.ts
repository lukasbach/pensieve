export {};

import { AIMessage } from "@langchain/core/messages";
import { z } from "zod";

const {
  getConfiguredChatModelMock,
  getSettingsMock,
  invokeMock,
  queryRecordingsExecuteMock,
} = vi.hoisted(() => ({
  getConfiguredChatModelMock: vi.fn(),
  getSettingsMock: vi.fn(),
  invokeMock: vi.fn(),
  queryRecordingsExecuteMock: vi.fn(),
}));

vi.mock("./chat-model", () => ({
  getConfiguredChatModel: getConfiguredChatModelMock,
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("./mcp-tools", () => ({
  mcpTools: {
    definitions: [
      {
        description: "Query recordings",
        execute: queryRecordingsExecuteMock,
        inputSchema: z.object({
          search: z.string().optional(),
        }),
        name: "query-recordings",
        summarizeResult: () => "Returned 1 matching recording.",
      },
      {
        description: "Open recording",
        execute: vi.fn(),
        inputSchema: z.object({
          recordingId: z.string(),
        }),
        name: "open-recording",
        summarizeResult: () => "Opened recording.",
      },
    ],
  },
}));

describe("chat", () => {
  beforeEach(() => {
    vi.resetModules();
    getConfiguredChatModelMock.mockReset();
    getSettingsMock.mockReset();
    invokeMock.mockReset();
    queryRecordingsExecuteMock.mockReset();
    getSettingsMock.mockResolvedValue({
      chat: {
        enabled: true,
        models: {
          ollama: "gemma3:4b",
          openai: "gpt-5.4",
        },
        provider: "openai",
      },
    });
    getConfiguredChatModelMock.mockResolvedValue({
      bindTools: (tools: unknown[]) => ({
        invoke: (...args: unknown[]) => {
          expect(tools).toHaveLength(1);
          expect((tools[0] as { name: string }).name).toBe("query-recordings");
          return invokeMock(...args);
        },
      }),
    });
  });

  it("uses tools and keeps the session history between messages", async () => {
    queryRecordingsExecuteMock.mockResolvedValue({
      items: [{ recordingId: "alpha" }],
      totalResults: 1,
    });
    invokeMock
      .mockResolvedValueOnce(
        new AIMessage({
          content: "",
          tool_calls: [
            {
              args: { search: "roadmap" },
              id: "call_1",
              name: "query-recordings",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        new AIMessage({
          content: "I found one recording that mentions the roadmap.",
        }),
      )
      .mockResolvedValueOnce(
        new AIMessage({
          content: "The follow-up discussion happened in the same recording.",
        }),
      );

    const { chat } = await import("./chat");
    const firstResponse = await chat.sendMessage(
      "session-1",
      "Find roadmap discussions",
    );

    expect(firstResponse).toEqual({
      content: "I found one recording that mentions the roadmap.",
    });
    expect(queryRecordingsExecuteMock).toHaveBeenCalledWith({
      search: "roadmap",
    });
    expect(invokeMock.mock.calls[0]?.[0]).toHaveLength(2);
    expect(invokeMock.mock.calls[1]?.[0]).toHaveLength(4);

    const secondResponse = await chat.sendMessage(
      "session-1",
      "What happened next?",
    );

    expect(secondResponse).toEqual({
      content: "The follow-up discussion happened in the same recording.",
    });
    expect(invokeMock.mock.calls[2]?.[0]).toHaveLength(6);
  });

  it("resets the session history when requested", async () => {
    invokeMock
      .mockResolvedValueOnce(new AIMessage({ content: "First answer" }))
      .mockResolvedValueOnce(new AIMessage({ content: "Fresh answer" }));

    const { chat } = await import("./chat");

    await chat.sendMessage("session-2", "First question");
    await chat.resetSession("session-2");
    await chat.sendMessage("session-2", "Fresh question");

    expect(invokeMock.mock.calls[0]?.[0]).toHaveLength(2);
    expect(invokeMock.mock.calls[1]?.[0]).toHaveLength(2);
  });

  it("rejects requests when chat is disabled", async () => {
    getSettingsMock.mockResolvedValue({
      chat: {
        enabled: false,
        models: {
          ollama: "gemma3:4b",
          openai: "gpt-5.4",
        },
        provider: "openai",
      },
    });

    const { chat } = await import("./chat");

    await expect(chat.sendMessage("session-3", "Hello")).rejects.toThrow(
      "Chat is disabled. Enable it in Settings > Chat first.",
    );
  });
});