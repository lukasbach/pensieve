import { act, renderHook } from "@testing-library/react";
import {
  blobToBuffer,
  isInRange,
  isNotNull,
  timeToDisplayString,
  useEvent,
} from "./utils";

describe("utils", () => {
  it("converts blobs to buffers", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])]);
    const buffer = await blobToBuffer(blob);

    expect(Array.from(buffer)).toEqual([1, 2, 3]);
  });

  it("formats timestamps for display", () => {
    expect(timeToDisplayString(61.75)).toBe("01:01.7");
    expect(timeToDisplayString(3661.75)).toBe("1:01:01.7");
    expect(timeToDisplayString(61.75, false)).toBe("01:01");
  });

  it("filters null values with the type guard", () => {
    expect([1, null, 2].filter(isNotNull)).toEqual([1, 2]);
  });

  it("checks half-open ranges", () => {
    expect(isInRange(10, [10, 20])).toBe(true);
    expect(isInRange(20, [10, 20])).toBe(false);
  });

  it("returns a stable callback that uses the latest handler", () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { result, rerender } = renderHook(
      ({ handler }) => useEvent(handler),
      {
        initialProps: { handler: firstHandler },
      },
    );

    const initialCallback = result.current;

    rerender({ handler: secondHandler });

    expect(result.current).toBe(initialCallback);

    act(() => {
      result.current("payload");
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith("payload");
  });
});
