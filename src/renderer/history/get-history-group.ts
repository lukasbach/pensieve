import type { Settings } from "../../types";

type HistoryGroup = {
  key: string;
  label: string;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const pad = (value: number) => value.toString().padStart(2, "0");

const getLocalDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  return weekStart;
};

export const getHistoryGroup = (
  started: string,
  groupBy: Settings["ui"]["historyGroupBy"],
): HistoryGroup | null => {
  const date = new Date(started);

  if (groupBy === "none") {
    return null;
  }

  if (groupBy === "month") {
    return {
      key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`,
      label: monthFormatter.format(date),
    };
  }

  if (groupBy === "week") {
    const weekStart = getWeekStart(date);
    return {
      key: getLocalDateKey(weekStart),
      label: `Week of ${weekFormatter.format(weekStart)}`,
    };
  }

  return {
    key: getLocalDateKey(date),
    label: date.toDateString(),
  };
};
