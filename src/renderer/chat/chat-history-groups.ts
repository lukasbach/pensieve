type ChatHistorySession = {
  createdAt: string;
  messageCount: number;
  sessionId: string;
  title: string;
  updatedAt: string;
};

type ChatHistoryGroup = {
  dayLabel: string;
  sessions: ChatHistorySession[];
};

const getSessionDayLabel = (session: ChatHistorySession) => {
  return new Date(session.updatedAt).toDateString();
};

export const groupChatHistorySessions = (sessions: ChatHistorySession[]) => {
  return sessions.reduce<ChatHistoryGroup[]>((groups, session) => {
    const dayLabel = getSessionDayLabel(session);
    const lastGroup = groups.at(-1);

    if (lastGroup?.dayLabel === dayLabel) {
      lastGroup.sessions.push(session);
      return groups;
    }

    groups.push({
      dayLabel,
      sessions: [session],
    });

    return groups;
  }, []);
};