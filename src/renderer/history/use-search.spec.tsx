import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useSearch } from "./use-search";
import { TestProvider } from "../test-provider";

const { historySearchMock } = vi.hoisted(() => ({
  historySearchMock: vi.fn(),
}));

vi.mock("@react-hookz/web", () => ({
  useDebouncedState: (initialValue: string) => useState(initialValue),
}));

vi.mock("../api", () => ({
  historyApi: {
    search: historySearchMock,
  },
}));

describe("useSearch", () => {
  beforeEach(() => {
    historySearchMock.mockReset();
  });

  it("returns a permissive filter before a search is applied", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestProvider });

    expect(
      result.current.filter([
        "recording-1",
        { started: "2024-01-01T10:00:00.000Z" },
      ] as any),
    ).toBe(true);
    expect(historySearchMock).not.toHaveBeenCalled();
  });

  it("queries history and filters items from the returned result set", async () => {
    historySearchMock.mockResolvedValue({
      alpha: "...roadmap...",
    });

    const { result } = renderHook(() => useSearch(), { wrapper: TestProvider });

    act(() => {
      result.current.setSearch("roadmap");
    });

    await waitFor(() => {
      expect(historySearchMock).toHaveBeenCalledWith("roadmap");
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual({ alpha: "...roadmap..." });
    });

    expect(
      result.current.filter([
        "alpha",
        { started: "2024-01-01T10:00:00.000Z" },
      ] as any),
    ).toBeTruthy();
    expect(
      result.current.filter([
        "beta",
        { started: "2024-01-01T10:00:00.000Z" },
      ] as any),
    ).toBeFalsy();
  });
});
