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
  Select,
} from "@radix-ui/themes";
import { HiPaperAirplane, HiSparkles, HiMagnifyingGlass } from "react-icons/hi2";
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
    recordingId: string;
    text: string;
    score: number;
    startTime: number;
    endTime: number;
  }>;
}

export const ChatScreen: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>("all");
  const [recordingSearchQuery, setRecordingSearchQuery] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if vector store is available
  const { data: isVectorStoreAvailable } = useQuery({
    queryKey: [QueryKeys.VectorStore, "available"],
    queryFn: historyApi.isVectorStoreAvailable,
    staleTime: 60000,
  });

  // Get vector store stats
  const { data: vectorStoreStats, refetch: refetchStats } = useQuery({
    queryKey: [QueryKeys.VectorStore, "stats"],
    queryFn: historyApi.getVectorStoreStats,
    enabled: isVectorStoreAvailable,
    staleTime: 30000,
  });

  // Get recordings list
  const { data: recordings } = useQuery({
    queryKey: [QueryKeys.History],
    queryFn: historyApi.getRecordings,
    staleTime: 60000,
  });

  // Filter recordings based on search query
  const filteredRecordings = recordings ? Object.entries(recordings)
    .filter(([id, meta]) => {
      if (!recordingSearchQuery) {
        return true;
      }
      const searchLower = recordingSearchQuery.toLowerCase();
      return (
        meta.name?.toLowerCase().includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );
    })
    .sort(([, a], [, b]) => {
      // Sort by name if available, otherwise by ID
      const nameA = a.name || a.started;
      const nameB = b.name || b.started;
      return nameA.localeCompare(nameB);
    }) : [];

  const [isPopulating, setIsPopulating] = useState(false);

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
            // Get relevant content using vector search
            const recordingFilter = selectedRecordingId === "all" ? undefined : selectedRecordingId;
            const searchResults = await historyApi.vectorSearch(input.trim(), 5, recordingFilter);

            // Generate conversational response using LLM
            const response = await historyApi.generateConversationalResponse(input.trim(), searchResults);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
        sources: searchResults.map(result => ({
          recordingId: result.recordingId,
          text: result.text,
          score: result.score,
          startTime: result.startTime,
          endTime: result.endTime,
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

  const handlePopulateVectorStore = async () => {
    setIsPopulating(true);
    try {
      const result = await historyApi.populateVectorStoreFromExistingTranscripts();
      console.log("Vector store population result:", result);
      // Refresh stats
      await refetchStats();
    } catch (error) {
      console.error("Failed to populate vector store:", error);
    } finally {
      setIsPopulating(false);
    }
  };

  if (!isVectorStoreAvailable) {
    return (
      <Box p="2rem" style={{ height: "100%" }}>
        <Flex direction="column" align="center" justify="center" gap="4" style={{ height: "100%" }}>
          <HiSparkles size="48" color="var(--gray-8)" />
          <Text size="4" weight="medium" color="gray">
            Vector Search Not Available
          </Text>
          <Text size="2" color="gray" align="center" style={{ maxWidth: "400px" }}>
            The vector search system needs to be initialized before you can use the chat feature. 
            This happens automatically when you record and process your first transcript.
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p="1rem" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header with stats */}
      <Flex justify="between" align="center" mb="2">
        <Text size="3" weight="medium">Chat with Your Transcripts</Text>
        <Flex align="center" gap="2">
          {selectedRecordingId !== "all" && recordings && (
            <Badge size="2" color="green" variant="soft">
              Filtered: {recordings[selectedRecordingId]?.name || `Recording ${selectedRecordingId}`}
            </Badge>
          )}
          {vectorStoreStats && (
            <Badge size="2" color="blue" variant="soft">
              {vectorStoreStats.totalChunks} chunks available
            </Badge>
          )}
          {vectorStoreStats && vectorStoreStats.totalChunks === 0 && (
            <Button
              size="1"
              variant="outline"
              onClick={handlePopulateVectorStore}
              disabled={isPopulating}
            >
              {isPopulating ? "Indexing..." : "Index Existing Transcripts"}
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Transcript Filter */}
      <Flex align="center" gap="2" mb="3">
        <Text size="2" weight="medium" color="gray">Filter by transcript:</Text>
        <Box style={{ position: "relative", minWidth: "300px" }}>
          <TextField.Root
            placeholder="Search transcripts..."
            value={recordingSearchQuery}
            onChange={(e) => setRecordingSearchQuery(e.target.value)}
            style={{ width: "100%" }}
          />
          {recordingSearchQuery && filteredRecordings.length > 0 && (
            <Box
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-2)",
                boxShadow: "var(--shadow-3)",
                zIndex: 10,
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <Box
                p="2"
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedRecordingId === "all" ? "var(--accent-3)" : "transparent",
                }}
                onClick={() => setSelectedRecordingId("all")}
              >
                <Text size="2">All Transcripts</Text>
              </Box>
              {filteredRecordings.slice(0, 10).map(([id, meta]) => (
                <Box
                  key={id}
                  p="2"
                  style={{
                    cursor: "pointer",
                    backgroundColor: selectedRecordingId === id ? "var(--accent-3)" : "transparent",
                  }}
                  onClick={() => {
                    setSelectedRecordingId(id);
                    setRecordingSearchQuery("");
                  }}
                >
                  <Text size="2">{meta.name || `Recording ${id}`}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        {selectedRecordingId !== "all" && (
          <Button
            size="1"
            variant="ghost"
            onClick={() => setSelectedRecordingId("all")}
          >
            Clear Filter
          </Button>
        )}
      </Flex>

      {/* Messages area */}
      <ScrollArea
        ref={scrollAreaRef}
        style={{ flex: 1, marginBottom: "1rem" }}
        scrollbars="vertical"
      >
        <Flex direction="column" gap="3">
          {messages.length === 0 && (
            <Card style={{ textAlign: "center", padding: "1rem" }}>
              <Flex direction="column" align="center" gap="3">
                <HiSparkles size="32" color="var(--accent-9)" />
                <Text size="3" weight="medium">Ask questions about your transcripts</Text>
                <Text size="2" color="gray">
                  I can help you find information across all your recorded conversations using semantic search.
                </Text>
              </Flex>
            </Card>
          )}

          {messages.map((message) => (
            <Card key={message.id} style={{
              padding: "0.75rem", 
              alignSelf: message.type === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              backgroundColor: message.type === "user" ? "var(--accent-3)" : "var(--gray-2)"
            }}>
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium" color={message.type === "user" ? "blue" : "gray"}>
                  {message.type === "user" ? "You" : "Assistant"}
                </Text>
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {message.content}
                </Text>
                {message.sources && message.sources.length > 0 && (
                  <Box mt="2">
                    <Text size="1" weight="medium" color="gray" mb="1">Sources:</Text>
                    {message.sources.map((source, index) => (
                      <Box key={index} p="2" style={{ backgroundColor: "var(--gray-1)", borderRadius: "4px" }} mb="1">
                        <Text size="1" color="gray">
                          Recording: {source.recordingId} (Score: {source.score.toFixed(3)})
                        </Text>
                        <Text size="1" style={{ fontStyle: "italic" }}>
                          "{source.text}"
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
                <Text size="1" color="gray">
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </Flex>
            </Card>
          ))}

          {isLoading && (
            <Card style={{ alignSelf: "flex-start", maxWidth: "80%", padding: "0.75rem" }}>
              <Flex align="center" gap="2">
                <Text size="2" color="gray">Assistant is thinking...</Text>
                <Box style={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid var(--gray-6)", 
                  borderTop: "2px solid var(--accent-9)", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite" 
                }} />
              </Flex>
            </Card>
          )}
        </Flex>
      </ScrollArea>

      {/* Input area */}
      <Flex gap="2" align="end">
        <TextField.Root
          placeholder="Ask a question about your transcripts..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
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
  );
};
