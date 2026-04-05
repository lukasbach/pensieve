const isValidTimePart = (value: number, max: number) =>
  Number.isInteger(value) && value >= 0 && value <= max;

const parseAutoEndTime = (autoEndTime: string) => {
  const [hours, minutes] = autoEndTime.split(":").map(Number);
  if (!isValidTimePart(hours, 23) || !isValidTimePart(minutes, 59)) {
    return null;
  }

  return { hours, minutes };
};

export const resolveRecordingAutoEndAt = (
  startedAt: string,
  autoEndTime?: string,
) => {
  if (!autoEndTime) return undefined;

  const time = parseAutoEndTime(autoEndTime);
  if (!time) return undefined;

  const start = new Date(startedAt);
  const end = new Date(start);
  end.setHours(time.hours, time.minutes, 0, 0);

  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  return end.toISOString();
};
