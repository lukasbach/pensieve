import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import * as settings from "./settings";
import { getConfiguredChatModel } from "./chat-model";
import { mcpTools } from "./mcp-tools";

const maxToolRounds = 6;

const systemPrompt = `You are the embedded Pensieve chat assistant.

You help the user answer questions about their local recordings of past meetings.
Use the available tools whenever the answer depends on recording metadata, transcript text, dates, summaries, or notes.
Be concise, cite specific recordings or transcript lines when the tools provide them, and avoid guessing when the tools do not support a conclusion.`;

const runtime = {
  sessions: new Map<
    string,
    Array<SystemMessage | HumanMessage | AIMessage | ToolMessage>
  >(),
};

const createSessionMessages = () => [new SystemMessage(systemPrompt)];

const ensureSessionMessages = (sessionId: string) => {
  const existingMessages = runtime.sessions.get(sessionId);

  if (existingMessages) {
    return existingMessages;
  }

  const newMessages = createSessionMessages();
  runtime.sessions.set(sessionId, newMessages);
  return newMessages;
};

const messageContentToText = (content: AIMessage["content"]) => {
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown chat error";
};

const createToolContent = (summary: string, result: unknown) => {
  return `${summary}\n\n${JSON.stringify(result, null, 2)}`;
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
            content: `Tool \"${call.name}\" is not available in chat.`,
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
  const sessionMessages = ensureSessionMessages(sessionId);
  const availableTools = createChatTools();
  const model = await getConfiguredChatModel({
    model: chatSettings.models[chatSettings.provider],
    provider: chatSettings.provider,
  });
  const messagesWithUserPrompt = [
    ...sessionMessages,
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

  runtime.sessions.set(sessionId, completedMessages);

  return {
    content: messageContentToText(assistantMessage.content),
  };
};

const resetSession = async (sessionId: string) => {
  runtime.sessions.set(sessionId, createSessionMessages());
};

const disposeSession = async (sessionId: string) => {
  runtime.sessions.delete(sessionId);
};

export const chat = {
  disposeSession,
  resetSession,
  sendMessage,
};
