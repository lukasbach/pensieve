import { FC, useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  TextField,
  Button,
  ScrollArea,
  Text,
  Card,
  Badge,
} from "@radix-ui/themes";
import { HiPaperAirplane, HiSparkles } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api";
import { QueryKeys } from "../../query-keys";
import { RecordingMeta } from "../../types";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    text: string;
    startTime: number;
    endTime: number;
    score: number;
  }>;
}

interface RecordingChatProps {
  recordingId: string;
  meta: RecordingMeta;
  onJumpTo?: (time: number) => void;
}

export const RecordingChat: FC<RecordingChatProps> = ({ 
  recordingId, 
  meta, 
  onJumpTo 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if vector store is available
  const { data: isVectorStoreAvailable } = useQuery({
    queryKey: [QueryKeys.VectorStore, "available"],
    queryFn: historyApi.isVectorStoreAvailable,
    staleTime: 60000,
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get relevant content using vector search scoped to this recording
      const searchResults = await historyApi.vectorSearch(input.trim(), 5, recordingId);

      // Generate conversational response using LLM
      const response = await historyApi.generateConversationalResponse(input.trim(), searchResults);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
        sources: searchResults.map(result => ({
          text: result.text,
          startTime: result.startTime,
          endTime: result.endTime,
          score: result.score,
        })),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVectorStoreAvailable) {
    return (
      <Box p="4">
        <Text color="gray">
          Vector search is not available. Please ensure the vector store is properly initialized.
        </Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" height="100%">
      {/* Chat Header */}
      <Box p="3" style={{ borderBottom: "1px solid var(--gray-6)" }}>
        <Text size="2" weight="medium" color="gray">
          Chat about "{meta.name || 'Untitled Recording'}"
        </Text>
        <Text size="1" color="gray">
          Ask questions about this specific recording
        </Text>
      </Box>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} style={{ flex: 1 }}>
        <Box p="3">
          {messages.length === 0 ? (
            <Box p="4" style={{ textAlign: "center" }}>
              <Text color="gray" size="2">
                Start a conversation about this recording. Ask questions about what was discussed, 
                who said what, or any other details you'd like to know.
              </Text>
            </Box>
          ) : (
            <Flex direction="column" gap="3">
              {messages.map((message) => (
                <Box key={message.id}>
                  <Flex direction="column" gap="2">
                    <Flex align="start" gap="2">
                      <Box
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: message.type === "user" ? "var(--blue-9)" : "var(--gray-9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {message.type === "user" ? (
                          <Text size="1" color="white">U</Text>
                        ) : (
                          <HiSparkles color="white" size="16" />
                        )}
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text size="1" color="gray" mb="1">
                          {message.type === "user" ? "You" : "Assistant"} • {message.timestamp.toLocaleTimeString()}
                        </Text>
                        <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                          {message.content}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <Box ml="10">
                        <Text size="1" color="gray" mb="2">
                          Sources:
                        </Text>
                        <Flex direction="column" gap="1">
                          {message.sources.map((source, index) => (
                            <Card key={index} variant="surface" size="1">
                              <Flex justify="between" align="start" gap="2">
                                <Box style={{ flex: 1 }}>
                                  <Text size="1" style={{ lineHeight: 1.4 }}>
                                    "{source.text}"
                                  </Text>
                                  <Flex align="center" gap="2" mt="1">
                                    <Badge variant="soft" color="blue">
                                      {formatTime(source.startTime)} - {formatTime(source.endTime)}
                                    </Badge>
                                    <Text size="1" color="gray">
                                      Score: {(source.score * 100).toFixed(1)}%
                                    </Text>
                                  </Flex>
                                </Box>
                                {onJumpTo && (
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={() => onJumpTo(source.startTime)}
                                  >
                                    Jump
                                  </Button>
                                )}
                              </Flex>
                            </Card>
                          ))}
                        </Flex>
                      </Box>
                    )}
                  </Flex>
                </Box>
              ))}
            </Flex>
          )}
        </Box>
      </ScrollArea>

      {/* Input */}
      <Box p="3" style={{ borderTop: "1px solid var(--gray-6)" }}>
        <Flex gap="2">
          <TextField.Root
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this recording..."
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="2"
          >
            <HiPaperAirplane />
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};
