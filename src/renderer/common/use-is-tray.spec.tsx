import { act, renderHook } from "@testing-library/react";
import { useIsTray } from "./use-is-tray";

const { cleanupMock, useSearchMock } = vi.hoisted(() => ({
  cleanupMock: vi.fn(),
  useSearchMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useSearch: useSearchMock,
}));

describe("useIsTray", () => {
  beforeEach(() => {
    cleanupMock.mockReset();
    useSearchMock.mockReset();
    useSearchMock.mockReturnValue({ tray: true });
  });

  it("tracks tray state from the route and preload events", () => {
    let listener: ((isTray: boolean) => void) | undefined;
    (window as any).ipcApi.onSetIsTray = vi.fn(
      (callback: (isTray: boolean) => void) => {
        listener = callback;
        return cleanupMock;
      },
    );

    const { result, unmount } = renderHook(() => useIsTray());

    expect(result.current).toBe(true);

    act(() => {
      listener?.(false);
    });

    expect(result.current).toBe(false);

    unmount();

    expect(cleanupMock).toHaveBeenCalledTimes(1);
  });
});
