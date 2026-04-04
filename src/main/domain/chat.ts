import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { app } from "electron";
import fs from "fs-extra";
import path from "path";
import { QueryKeys } from "../../query-keys";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import * as settings from "./settings";
import { getConfiguredChatModel } from "./chat-model";
import { mcpTools } from "./mcp-tools";

const maxToolRounds = 6;

const systemPrompt = `You are the embedded Pensieve chat assistant.

You help the user answer questions about their local recordings of past meetings.
Use the available tools whenever the answer depends on recording metadata, transcript text, dates, summaries, or notes.
Be concise, cite specific recordings or transcript lines when the tools provide them, and avoid guessing when the tools do not support a conclusion.`;

type RuntimeSessionMessage =
  | SystemMessage
  | HumanMessage
  | AIMessage
  | ToolMessage;

type RuntimeSession = {
  createdAt: string;
  messages: RuntimeSessionMessage[];
  updatedAt: string;
};

type StoredVisibleMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

type StoredSessionMessage =
  | {
      content: string;
      type: "ai";
      toolCalls?: AIMessage["tool_calls"];
    }
  | {
      content: string;
      type: "human" | "system";
    }
  | {
      content: string;
      name?: string;
      toolCallId: string;
      type: "tool";
    };

type StoredChatSession = {
  createdAt: string;
  sessionId: string;
  sessionMessages: StoredSessionMessage[];
  title: string;
  updatedAt: string;
  visibleMessages: StoredVisibleMessage[];
};

const getChatHistoryFolder = () => {
  return path.join(app.getPath("userData"), "chat-history");
};

const getChatHistoryFile = (sessionId: string) => {
  return path.join(getChatHistoryFolder(), `${sessionId}.json`);
};

const createSessionTimestamp = () => new Date().toISOString();

const runtime = {
  sessions: new Map<string, RuntimeSession>(),
};

const createSessionMessages = () => [new SystemMessage(systemPrompt)];

const createRuntimeSession = (
  timestamp = createSessionTimestamp(),
  messages = createSessionMessages(),
): RuntimeSession => ({
  createdAt: timestamp,
  messages,
  updatedAt: timestamp,
});

const messageContentToText = (
  content:
    | AIMessage["content"]
    | HumanMessage["content"]
    | SystemMessage["content"]
    | ToolMessage["content"],
) => {
  if (typeof content === "string") {
    return content.trim();
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if ("text" in part && typeof part.text === "string") {
        return part.text;
      }

      return JSON.stringify(part);
    })
    .join("\n")
    .trim();
};

const createVisibleMessages = (
  messages: RuntimeSessionMessage[],
): StoredVisibleMessage[] => {
  return messages.reduce<StoredVisibleMessage[]>(
    (visibleMessages, message, index) => {
      if (message instanceof HumanMessage) {
        const content = messageContentToText(message.content);

        if (content.length) {
          visibleMessages.push({
            content,
            id: `user-${index}`,
            role: "user",
          });
        }

        return visibleMessages;
      }

      if (message instanceof AIMessage) {
        if (message.tool_calls?.length) {
          return visibleMessages;
        }

        const content = messageContentToText(message.content);

        if (content.length) {
          visibleMessages.push({
            content,
            id: `assistant-${index}`,
            role: "assistant",
          });
        }

        return visibleMessages;
      }

      return visibleMessages;
    },
    [],
  );
};

const createSessionTitle = (messages: StoredVisibleMessage[]) => {
  const sourceText =
    messages.find(({ role }) => role === "user")?.content ??
    messages[0]?.content ??
    "Untitled chat";
  const normalizedText = sourceText.replace(/\s+/g, " ").trim();

  return normalizedText.length > 72
    ? `${normalizedText.slice(0, 69).trimEnd()}...`
    : normalizedText;
};

const serializeRuntimeMessage = (
  message: RuntimeSessionMessage,
): StoredSessionMessage => {
  if (message instanceof SystemMessage) {
    return {
      content: messageContentToText(message.content),
      type: "system",
    };
  }

  if (message instanceof HumanMessage) {
    return {
      content: messageContentToText(message.content),
      type: "human",
    };
  }

  if (message instanceof ToolMessage) {
    return {
      content: messageContentToText(message.content),
      ...(message.name ? { name: message.name } : {}),
      toolCallId: message.tool_call_id,
      type: "tool",
    };
  }

  return {
    content: messageContentToText(message.content),
    ...(message.tool_calls?.length ? { toolCalls: message.tool_calls } : {}),
    type: "ai",
  };
};

const deserializeStoredMessage = (
  message: StoredSessionMessage,
): RuntimeSessionMessage => {
  switch (message.type) {
    case "system":
      return new SystemMessage(message.content);
    case "human":
      return new HumanMessage(message.content);
    case "tool":
      return new ToolMessage({
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
        tool_call_id: message.toolCallId,
      });
    case "ai":
      return new AIMessage({
        content: message.content,
        ...(message.toolCalls?.length ? { tool_calls: message.toolCalls } : {}),
      });
    default:
      throw new Error("Unsupported stored chat message type");
  }
};

const createStoredSession = (
  sessionId: string,
  session: RuntimeSession,
): StoredChatSession => {
  const visibleMessages = createVisibleMessages(session.messages);

  return {
    createdAt: session.createdAt,
    sessionId,
    sessionMessages: session.messages.map(serializeRuntimeMessage),
    title: createSessionTitle(visibleMessages),
    updatedAt: session.updatedAt,
    visibleMessages,
  };
};

const hydrateRuntimeSession = (storedSession: StoredChatSession) => {
  return {
    createdAt: storedSession.createdAt,
    messages: storedSession.sessionMessages.map(deserializeStoredMessage),
    updatedAt: storedSession.updatedAt,
  } satisfies RuntimeSession;
};

const ensureChatHistoryFolder = async () => {
  await fs.ensureDir(getChatHistoryFolder());
};

const readStoredSession = async (sessionId: string) => {
  const sessionFile = getChatHistoryFile(sessionId);

  if (!fs.existsSync(sessionFile)) {
    return null;
  }

  return (await fs.readJSON(sessionFile)) as StoredChatSession;
};

const ensureRuntimeSession = async (sessionId: string) => {
  const existingSession = runtime.sessions.get(sessionId);

  if (existingSession) {
    return existingSession;
  }

  const storedSession = await readStoredSession(sessionId);

  if (storedSession) {
    const hydratedSession = hydrateRuntimeSession(storedSession);
    runtime.sessions.set(sessionId, hydratedSession);
    return hydratedSession;
  }

  const newSession = createRuntimeSession();
  runtime.sessions.set(sessionId, newSession);
  return newSession;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown chat error";
};

const createToolContent = (summary: string, result: unknown) => {
  return `${summary}\n\n${JSON.stringify(result, null, 2)}`;
};

const persistSession = async (sessionId: string, session: RuntimeSession) => {
  const storedSession = createStoredSession(sessionId, session);

  if (!storedSession.visibleMessages.length) {
    const sessionFile = getChatHistoryFile(sessionId);

    if (fs.existsSync(sessionFile)) {
      await fs.remove(sessionFile);
      invalidateUiKeys(QueryKeys.ChatHistory);
    }

    return;
  }

  await ensureChatHistoryFolder();
  await fs.writeJSON(getChatHistoryFile(sessionId), storedSession, {
    spaces: 2,
  });
  invalidateUiKeys(QueryKeys.ChatHistory);
};

const createChatTools = () => {
  return mcpTools.definitions
    .filter(({ name }) => name !== "open-recording")
    .map((definition) =>
      tool(
        async (input) => {
          const result = await definition.execute(input as never);
          return createToolContent(definition.summarizeResult(result), result);
        },
        {
          description: definition.description,
          name: definition.name,
          schema: definition.inputSchema,
        },
      ),
    );
};

const runToolLoop = async (
  initialMessages: Array<
    SystemMessage | HumanMessage | AIMessage | ToolMessage
  >,
  sessionModel: ReturnType<
    Awaited<ReturnType<typeof getConfiguredChatModel>>["bindTools"]
  >,
  availableTools: ReturnType<typeof createChatTools>,
) => {
  const toolsByName = new Map(
    availableTools.map((entry) => [entry.name, entry]),
  );
  let messages = [...initialMessages];

  for (let attempt = 0; attempt < maxToolRounds; attempt += 1) {
    const response = await sessionModel.invoke(messages);
    messages = [...messages, response];

    if (!response.tool_calls?.length) {
      return messages;
    }

    const toolMessages = await Promise.all(
      response.tool_calls.map(async (call) => {
        const selectedTool = toolsByName.get(call.name);

        if (!selectedTool) {
          return new ToolMessage({
            content: `Tool "${call.name}" is not available in chat.`,
            name: call.name,
            tool_call_id: call.id ?? call.name,
          });
        }

        try {
          const result = await selectedTool.invoke(call.args);

          return new ToolMessage({
            content:
              typeof result === "string" ? result : JSON.stringify(result),
            name: call.name,
            tool_call_id: call.id ?? call.name,
          });
        } catch (error) {
          return new ToolMessage({
            content: `Tool error: ${getErrorMessage(error)}`,
            name: call.name,
            tool_call_id: call.id ?? call.name,
          });
        }
      }),
    );

    messages = [...messages, ...toolMessages];
  }

  throw new Error("Chat exceeded the maximum number of tool-calling steps.");
};

const assertChatEnabled = async () => {
  const { chat } = await settings.getSettings();

  if (!chat.enabled) {
    throw new Error("Chat is disabled. Enable it in Settings > Chat first.");
  }

  return chat;
};

const sendMessage = async (sessionId: string, message: string) => {
  const trimmedMessage = message.trim();

  if (!trimmedMessage.length) {
    throw new Error("Chat messages cannot be empty.");
  }

  const chatSettings = await assertChatEnabled();
  const session = await ensureRuntimeSession(sessionId);
  const availableTools = createChatTools();
  const model = await getConfiguredChatModel({
    model: chatSettings.models[chatSettings.provider],
    provider: chatSettings.provider,
  });
  const messagesWithUserPrompt = [
    ...session.messages,
    new HumanMessage(trimmedMessage),
  ];
  const completedMessages = await runToolLoop(
    messagesWithUserPrompt,
    model.bindTools(availableTools),
    availableTools,
  );
  const assistantMessage = [...completedMessages]
    .reverse()
    .find((entry) => entry instanceof AIMessage);

  if (!assistantMessage) {
    throw new Error("The chat model did not produce a response.");
  }

  const updatedSession = {
    ...session,
    messages: completedMessages,
    updatedAt: createSessionTimestamp(),
  } satisfies RuntimeSession;

  runtime.sessions.set(sessionId, updatedSession);
  await persistSession(sessionId, updatedSession);

  return {
    content: messageContentToText(assistantMessage.content),
  };
};

const listSessions = async () => {
  await ensureChatHistoryFolder();

  const sessionFiles = (await fs.readdir(getChatHistoryFolder())).filter(
    (fileName) => fileName.endsWith(".json") && !fileName.startsWith("."),
  );
  const sessions = await Promise.all(
    sessionFiles.map(async (fileName) => {
      return (await fs.readJSON(
        path.join(getChatHistoryFolder(), fileName),
      )) as StoredChatSession;
    }),
  );

  return sessions
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    )
    .map(({ createdAt, sessionId, title, updatedAt, visibleMessages }) => ({
      createdAt,
      messageCount: visibleMessages.length,
      sessionId,
      title,
      updatedAt,
    }));
};

const loadSession = async (sessionId: string) => {
  const storedSession = await readStoredSession(sessionId);

  if (!storedSession) {
    throw new Error(`Chat session "${sessionId}" was not found.`);
  }

  runtime.sessions.set(sessionId, hydrateRuntimeSession(storedSession));

  return {
    createdAt: storedSession.createdAt,
    messages: storedSession.visibleMessages,
    sessionId: storedSession.sessionId,
    title: storedSession.title,
    updatedAt: storedSession.updatedAt,
  };
};

const resetSession = async (sessionId: string) => {
  runtime.sessions.set(sessionId, createRuntimeSession());

  const sessionFile = getChatHistoryFile(sessionId);
  if (fs.existsSync(sessionFile)) {
    await fs.remove(sessionFile);
    invalidateUiKeys(QueryKeys.ChatHistory);
  }
};

const disposeSession = async (sessionId: string) => {
  runtime.sessions.delete(sessionId);
};

export const chat = {
  disposeSession,
  listSessions,
  loadSession,
  resetSession,
  sendMessage,
};
