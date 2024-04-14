const scrollPositions: Record<number, number> = {};

export const SCROLL_CONTAINER_ID = "transcript-scroll-container";

export const setScrollPosition = (time: number, position: number) => {
  scrollPositions[time] = position;
};

export const getScrollPositionAt = (time: number) => {
  if (scrollPositions[time] !== undefined) {
    return scrollPositions[time];
  }

  const closest = Object.entries(scrollPositions).reduce(
    (old, [exactTimeString, scrollPos]) => {
      const exactTime = Number.parseInt(exactTimeString);
      const dist = Math.abs(exactTime - time);
      return dist < old.dist ? { exactTime, scrollPos, dist } : old;
    },
    { exactTime: 0, dist: Number.MAX_SAFE_INTEGER, scrollPos: 0 },
  );
  return closest.scrollPos ?? 0;
};

export const scrollToTime = (time: number) => {
  const container = document.getElementById(SCROLL_CONTAINER_ID);
  if (!container) return;

  const position = getScrollPositionAt(time);
  container.scrollTo({ top: position - 200, behavior: "smooth" });
};
