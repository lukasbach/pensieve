import { FC, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { HiOutlineChatBubbleLeftRight, HiOutlineCheck } from "react-icons/hi2";
import { QueryKeys } from "../../query-keys";
import { chatApi } from "../api";
import { groupChatHistorySessions } from "./chat-history-groups";

type LoadedChatSession = Awaited<ReturnType<typeof chatApi.loadSession>>;

type ChatHistoryMenuProps = {
  currentSessionId: string;
  onLoadSession: (session: LoadedChatSession) => void | Promise<void>;
};

export const ChatHistoryMenu: FC<ChatHistoryMenuProps> = ({
  currentSessionId,
  onLoadSession,
}) => {
  const { data: sessions } = useQuery({
    queryKey: [QueryKeys.ChatHistory],
    queryFn: chatApi.listSessions,
  });
  const groupedSessions = groupChatHistorySessions(sessions ?? []);

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
        {groupedSessions.length ? (
          groupedSessions.map((group, groupIndex) => (
            <Fragment key={group.dayLabel}>
              {groupIndex > 0 ? <DropdownMenu.Separator /> : null}
              <DropdownMenu.Label>{group.dayLabel}</DropdownMenu.Label>
              {group.sessions.map((session) => (
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
                  {session.title}
                </DropdownMenu.Item>
              ))}
            </Fragment>
          ))
        ) : (
          <DropdownMenu.Item disabled>No previous chats</DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
