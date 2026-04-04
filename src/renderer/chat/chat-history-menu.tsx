import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { HiOutlineChatBubbleLeftRight, HiOutlineCheck } from "react-icons/hi2";
import { QueryKeys } from "../../query-keys";
import { chatApi } from "../api";

type LoadedChatSession = Awaited<ReturnType<typeof chatApi.loadSession>>;

type ChatHistoryMenuProps = {
  currentSessionId: string;
  onLoadSession: (session: LoadedChatSession) => void | Promise<void>;
};

const formatHistoryLabel = (session: {
  sessionId: string;
  title: string;
  updatedAt: string;
}) => {
  return `${session.title.substring(0, 20)}... (${new Date(session.updatedAt).toLocaleString()})`;
};

export const ChatHistoryMenu: FC<ChatHistoryMenuProps> = ({
  currentSessionId,
  onLoadSession,
}) => {
  const { data: sessions } = useQuery({
    queryKey: [QueryKeys.ChatHistory],
    queryFn: chatApi.listSessions,
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          aria-label="Open chat history"
          variant="outline"
          color="gray"
        >
          <HiOutlineChatBubbleLeftRight />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {sessions?.length ? (
          sessions.map((session) => (
            <DropdownMenu.Item
              key={session.sessionId}
              onClick={async () => {
                await onLoadSession(
                  await chatApi.loadSession(session.sessionId),
                );
              }}
            >
              <HiOutlineCheck
                style={{
                  opacity: currentSessionId === session.sessionId ? 1 : 0,
                }}
              />
              {formatHistoryLabel(session)}
            </DropdownMenu.Item>
          ))
        ) : (
          <DropdownMenu.Item disabled>No previous chats</DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
