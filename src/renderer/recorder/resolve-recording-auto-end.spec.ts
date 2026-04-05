import { resolveRecordingAutoEndAt } from "./resolve-recording-auto-end";

describe("resolveRecordingAutoEndAt", () => {
  it("returns undefined when no time is configured", () => {
    expect(resolveRecordingAutoEndAt(new Date().toISOString())).toBeUndefined();
  });

  it("uses the same day when the selected time is still ahead", () => {
    const startedAt = new Date(2026, 3, 4, 10, 15, 0, 0).toISOString();
    const autoEndAt = resolveRecordingAutoEndAt(startedAt, "11:30");

    expect(autoEndAt).toBeDefined();
    const resolvedDate = new Date(autoEndAt ?? "");
    expect(resolvedDate.getFullYear()).toBe(2026);
    expect(resolvedDate.getMonth()).toBe(3);
    expect(resolvedDate.getDate()).toBe(4);
    expect(resolvedDate.getHours()).toBe(11);
    expect(resolvedDate.getMinutes()).toBe(30);
  });

  it("rolls over to the next day when the selected time already passed", () => {
    const startedAt = new Date(2026, 3, 4, 23, 15, 0, 0).toISOString();
    const autoEndAt = resolveRecordingAutoEndAt(startedAt, "00:30");
    const resolvedDate = new Date(autoEndAt ?? "");

    expect(resolvedDate.getFullYear()).toBe(2026);
    expect(resolvedDate.getMonth()).toBe(3);
    expect(resolvedDate.getDate()).toBe(5);
    expect(resolvedDate.getHours()).toBe(0);
    expect(resolvedDate.getMinutes()).toBe(30);
  });
});
