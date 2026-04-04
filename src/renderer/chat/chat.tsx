import {
  FC,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
  TextArea,
} from "@radix-ui/themes";
import {
  HiOutlineArrowPath,
  HiOutlinePaperAirplane,
  HiSparkles,
} from "react-icons/hi2";
import { QueryKeys } from "../../query-keys";
import { chatApi, mainApi, windowsApi } from "../api";
import { EmptyState } from "../common/empty-state";
import { SettingsTab } from "../settings/tabs";
import { ChatHistoryMenu } from "./chat-history-menu";
import { ChatRichContent } from "./chat-rich-content";
import * as styles from "./chat.module.css";

type ChatUiMessage = {
  content: string;
  id: string;
  isError?: boolean;
  role: "assistant" | "user";
};

const suggestedPrompts = [
  "What decisions were made this week?",
  "Find meetings that mention the roadmap.",
  "Summarize the latest discussion about hiring.",
  "Which recording mentioned action items for me?",
];

const createSessionId = () => {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

type LoadedChatSession = Awaited<ReturnType<typeof chatApi.loadSession>>;

const createMessage = (
  role: ChatUiMessage["role"],
  content: string,
  isError = false,
) =>
  ({
    content,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...(isError ? { isError } : {}),
    role,
  }) satisfies ChatUiMessage;

export const Chat: FC = () => {
  const { data: settings } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });
  const [sessionId, setSessionId] = useState(createSessionId);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const trimmedInput = useMemo(() => input.trim(), [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isSending, messages]);

  useEffect(() => {
    return () => {
      chatApi.disposeSession(sessionId);
    };
  }, [sessionId]);

  const handleReset = () => {
    setSessionId(createSessionId());
    setMessages([]);
    setInput("");
    setIsSending(false);
  };

  const handleLoadSession = async (session: LoadedChatSession) => {
    setSessionId(session.sessionId);
    setMessages(session.messages);
    setInput("");
    setIsSending(false);
  };

  const handleSendMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage.length || isSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage("user", trimmedMessage),
    ]);
    setInput("");
    setIsSending(true);

    try {
      const response = await chatApi.sendMessage(sessionId, trimmedMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          "assistant",
          response.content || "No response received from the chat model.",
        ),
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          "assistant",
          error instanceof Error ? error.message : "Unknown chat error",
          true,
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSendMessage(input);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(input);
    }
  };

  if (!settings) {
    return (
      <EmptyState
        title="Loading chat"
        description="Reading the current chat configuration."
      />
    );
  }

  if (!settings.chat.enabled) {
    return (
      <EmptyState
        title="Chat is not enabled"
        description="Enable Chat in Settings and choose either OpenAI or Ollama to ask questions about your recordings."
        icon={<HiSparkles size={28} />}
      >
        <Button onClick={() => windowsApi.openSettingsWindow(SettingsTab.Chat)}>
          Open chat settings
        </Button>
      </EmptyState>
    );
  }

  return (
    <Flex
      direction="column"
      gap="3"
      height="100%"
      maxWidth="56rem"
      width="100%"
      mx="auto"
      px="1rem"
      py="1rem"
      className={styles.root}
    >
      <Flex align="center" justify="between" className={styles.toolbar}>
        <Heading size="6">Chat</Heading>
        <Flex gap="2">
          <ChatHistoryMenu
            currentSessionId={sessionId}
            onLoadSession={handleLoadSession}
          />
          <Button
            type="button"
            variant="outline"
            color="gray"
            onClick={handleReset}
            disabled={messages.length === 0 && input.length === 0}
          >
            <HiOutlineArrowPath /> New chat
          </Button>
        </Flex>
      </Flex>

      <Box className={styles.conversation}>
        {messages.length === 0 ? (
          <div className={styles.hero}>
            <Heading size="7">
              Ask about decisions, topics, and follow-ups.
            </Heading>
            <Text size="3" color="gray">
              The assistant can search recordings, inspect metadata, and read
              transcript lines before answering.
            </Text>
            <div className={styles.promptGrid}>
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="surface"
                  color="gray"
                  className={styles.promptButton}
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageRow} ${
                message.role === "user"
                  ? styles.messageRowUser
                  : styles.messageRowAssistant
              }`}
            >
              <Box
                className={`${styles.bubble} ${
                  message.role === "user"
                    ? styles.bubbleUser
                    : styles.bubbleAssistant
                } ${message.isError ? styles.bubbleError : ""}`}
              >
                {message.role === "assistant" ? (
                  <ChatRichContent content={message.content} />
                ) : (
                  <Text as="p">{message.content}</Text>
                )}
              </Box>
            </div>
          ))
        )}

        {isSending && (
          <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
            <Box className={`${styles.bubble} ${styles.bubbleAssistant}`}>
              <Text as="p">Thinking…</Text>
            </Box>
          </div>
        )}

        <div ref={bottomRef} />
      </Box>

      <form onSubmit={handleSubmit} className={styles.composer}>
        <TextArea
          aria-label="Chat message"
          className={styles.input}
          placeholder="Ask about a recording, topic, or follow-up..."
          resize="vertical"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={handleComposerKeyDown}
          disabled={isSending}
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          className={styles.sendButton}
          disabled={!trimmedInput.length || isSending}
        >
          <HiOutlinePaperAirplane />
        </IconButton>
      </form>
    </Flex>
  );
};
