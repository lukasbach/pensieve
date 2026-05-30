import { AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { QueryKeys } from "../../query-keys";

export {};

const userDataFolder = "C:\\Users\\tester\\AppData\\Roaming\\Pensieve";
const historyFolder = `${userDataFolder}\\chat-history`;

const getChatHistoryFile = (sessionId: string) => {
  return `${historyFolder}\\${sessionId}.json`;
};

const {
  appGetPathMock,
  ensureDirMock,
  existsSyncMock,
  getConfiguredChatModelMock,
  getSettingsMock,
  invalidateUiKeysMock,
  invokeMock,
  queryRecordingsExecuteMock,
  readJSONMock,
  readdirMock,
  removeMock,
  storedFiles,
  writeJSONMock,
} = vi.hoisted(() => ({
  appGetPathMock: vi.fn(),
  ensureDirMock: vi.fn(),
  existsSyncMock: vi.fn(),
  getConfiguredChatModelMock: vi.fn(),
  getSettingsMock: vi.fn(),
  invalidateUiKeysMock: vi.fn(),
  invokeMock: vi.fn(),
  queryRecordingsExecuteMock: vi.fn(),
  readJSONMock: vi.fn(),
  readdirMock: vi.fn(),
  removeMock: vi.fn(),
  storedFiles: new Map<string, unknown>(),
  writeJSONMock: vi.fn(),
}));

vi.mock("electron", () => ({
  app: { getPath: appGetPathMock },
}));

vi.mock("fs-extra", () => ({
  default: {
    ensureDir: ensureDirMock,
    existsSync: existsSyncMock,
    readJSON: readJSONMock,
    readdir: readdirMock,
    remove: removeMock,
    writeJSON: writeJSONMock,
  },
}));

vi.mock("../ipc/invalidate-ui", () => ({
  invalidateUiKeys: invalidateUiKeysMock,
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
    storedFiles.clear();
    appGetPathMock.mockReset();
    ensureDirMock.mockReset();
    existsSyncMock.mockReset();
    getConfiguredChatModelMock.mockReset();
    getSettingsMock.mockReset();
    invalidateUiKeysMock.mockReset();
    invokeMock.mockReset();
    queryRecordingsExecuteMock.mockReset();
    readJSONMock.mockReset();
    readdirMock.mockReset();
    removeMock.mockReset();
    writeJSONMock.mockReset();

    appGetPathMock.mockReturnValue(userDataFolder);
    ensureDirMock.mockResolvedValue(undefined);
    existsSyncMock.mockImplementation((filePath: string) => {
      return storedFiles.has(filePath);
    });
    readJSONMock.mockImplementation(async (filePath: string) => {
      if (!storedFiles.has(filePath)) {
        throw new Error(`ENOENT: ${filePath}`);
      }

      return storedFiles.get(filePath);
    });
    readdirMock.mockImplementation(async (folderPath: string) => {
      return Array.from(storedFiles.keys())
        .filter((filePath) => filePath.startsWith(`${folderPath}\\`))
        .map((filePath) => filePath.split(/[\\/]/).at(-1) as string);
    });
    removeMock.mockImplementation(async (filePath: string) => {
      storedFiles.delete(filePath);
    });
    writeJSONMock.mockImplementation(
      async (filePath: string, data: unknown) => {
        storedFiles.set(filePath, data);
      },
    );

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

  it("uses tools, persists chat history, and lists saved sessions", async () => {
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

    expect(storedFiles.get(getChatHistoryFile("session-1"))).toEqual(
      expect.objectContaining({
        sessionId: "session-1",
        title: "Find roadmap discussions",
        visibleMessages: [
          expect.objectContaining({
            content: "Find roadmap discussions",
            role: "user",
          }),
          expect.objectContaining({
            content: "I found one recording that mentions the roadmap.",
            role: "assistant",
          }),
        ],
      }),
    );

    const sessions = await chat.listSessions();

    expect(sessions).toEqual([
      expect.objectContaining({
        messageCount: 2,
        sessionId: "session-1",
        title: "Find roadmap discussions",
      }),
    ]);
    expect(invalidateUiKeysMock).toHaveBeenCalledWith(QueryKeys.ChatHistory);

    const secondResponse = await chat.sendMessage(
      "session-1",
      "What happened next?",
    );

    expect(secondResponse).toEqual({
      content: "The follow-up discussion happened in the same recording.",
    });
    expect(invokeMock.mock.calls[2]?.[0]).toHaveLength(6);
  });

  it("loads a persisted session and continues the conversation", async () => {
    invokeMock
      .mockResolvedValueOnce(new AIMessage({ content: "First answer" }))
      .mockResolvedValueOnce(new AIMessage({ content: "Fresh answer" }));

    const { chat } = await import("./chat");

    await chat.sendMessage("session-2", "First question");
    await chat.disposeSession("session-2");

    const loadedSession = await chat.loadSession("session-2");

    expect(loadedSession).toEqual(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            content: "First question",
            role: "user",
          }),
          expect.objectContaining({
            content: "First answer",
            role: "assistant",
          }),
        ],
        sessionId: "session-2",
        title: "First question",
      }),
    );

    await chat.sendMessage("session-2", "Fresh question");

    expect(invokeMock.mock.calls[1]?.[0]).toHaveLength(4);
  });

  it("removes persisted history when the session is reset", async () => {
    invokeMock.mockResolvedValueOnce(
      new AIMessage({ content: "Stored answer" }),
    );

    const { chat } = await import("./chat");

    await chat.sendMessage("session-3", "Stored question");
    await chat.resetSession("session-3");

    expect(storedFiles.has(getChatHistoryFile("session-3"))).toBe(false);
    expect(await chat.listSessions()).toEqual([]);
    expect(removeMock).toHaveBeenCalledWith(getChatHistoryFile("session-3"));
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

    await expect(chat.sendMessage("session-4", "Hello")).rejects.toThrow(
      "Chat is disabled. Enable it in Settings > Chat first.",
    );
  });
});
