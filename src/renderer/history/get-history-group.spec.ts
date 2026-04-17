import { getHistoryGroup } from "./get-history-group";

describe("getHistoryGroup", () => {
  it("returns no grouping when disabled", () => {
    expect(getHistoryGroup("2024-01-03T10:00:00.000Z", "none")).toBeNull();
  });

  it("groups recordings by day", () => {
    const first = getHistoryGroup("2024-01-03T10:00:00.000Z", "day");
    const second = getHistoryGroup("2024-01-03T17:00:00.000Z", "day");
    const third = getHistoryGroup("2024-01-04T10:00:00.000Z", "day");

    if (!first || !second || !third) {
      throw new Error("Expected day grouping");
    }

    expect(first).toEqual({
      key: "2024-01-03",
      label: "Wed Jan 03 2024",
    });
    expect(second.key).toBe(first.key);
    expect(third.key).not.toBe(first.key);
  });

  it("groups recordings by week", () => {
    const first = getHistoryGroup("2024-01-01T10:00:00.000Z", "week");
    const second = getHistoryGroup("2024-01-03T10:00:00.000Z", "week");
    const third = getHistoryGroup("2024-01-08T10:00:00.000Z", "week");

    if (!first || !second || !third) {
      throw new Error("Expected week grouping");
    }

    expect(first).toEqual({
      key: "2024-01-01",
      label: "Week of Jan 1, 2024",
    });
    expect(second.key).toBe(first.key);
    expect(third.key).not.toBe(first.key);
  });

  it("groups recordings by month", () => {
    const first = getHistoryGroup("2024-01-03T10:00:00.000Z", "month");
    const second = getHistoryGroup("2024-01-31T10:00:00.000Z", "month");
    const third = getHistoryGroup("2024-02-01T10:00:00.000Z", "month");

    if (!first || !second || !third) {
      throw new Error("Expected month grouping");
    }

    expect(first).toEqual({
      key: "2024-01",
      label: "January 2024",
    });
    expect(second.key).toBe(first.key);
    expect(third.key).not.toBe(first.key);
  });
});
