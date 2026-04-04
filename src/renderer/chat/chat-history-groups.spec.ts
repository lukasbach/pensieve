import { groupChatHistorySessions } from "./chat-history-groups";

describe("groupChatHistorySessions", () => {
  it("groups consecutive sessions by updated day", () => {
    const groups = groupChatHistorySessions([
      {
        createdAt: "2026-04-04T09:00:00.000Z",
        messageCount: 4,
        sessionId: "session-1",
        title: "Roadmap follow-up",
        updatedAt: "2026-04-04T10:00:00.000Z",
      },
      {
        createdAt: "2026-04-04T07:30:00.000Z",
        messageCount: 2,
        sessionId: "session-2",
        title: "Hiring discussion",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        createdAt: "2026-04-03T16:30:00.000Z",
        messageCount: 3,
        sessionId: "session-3",
        title: "Launch risks",
        updatedAt: "2026-04-03T17:00:00.000Z",
      },
    ]);

    expect(groups).toEqual([
      {
        dayLabel: new Date("2026-04-04T10:00:00.000Z").toDateString(),
        sessions: [
          expect.objectContaining({
            sessionId: "session-1",
            title: "Roadmap follow-up",
          }),
          expect.objectContaining({
            sessionId: "session-2",
            title: "Hiring discussion",
          }),
        ],
      },
      {
        dayLabel: new Date("2026-04-03T17:00:00.000Z").toDateString(),
        sessions: [
          expect.objectContaining({
            sessionId: "session-3",
            title: "Launch risks",
          }),
        ],
      },
    ]);
  });

  it("returns no groups for an empty session list", () => {
    expect(groupChatHistorySessions([])).toEqual([]);
  });
});