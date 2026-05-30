import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { Settings } from "../../types";
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
  const recordings = {
    alpha: {
      isPinned: true,
      isPostProcessed: true,
      started: "2024-01-03T10:00:00.000Z",
      tags: ["Roadmap", "Urgent"],
    },
    beta: {
      hasEmbedding: false,
      isPostProcessed: false,
      started: "2024-01-02T10:00:00.000Z",
      tags: ["Roadmap"],
    },
    gamma: {
      hasEmbedding: true,
      isPostProcessed: true,
      started: "2024-01-01T10:00:00.000Z",
      tags: ["Support"],
    },
  };

  beforeEach(() => {
    historySearchMock.mockReset();
  });

  it("returns sorted visible and pinned recordings before a search is applied", () => {
    const { result } = renderHook(
      () => useSearch({ embeddingsEnabled: true, recordings }),
      { wrapper: TestProvider },
    );

    expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(result.current.pinnedItems.map(([id]) => id)).toEqual(["alpha"]);
    expect(historySearchMock).not.toHaveBeenCalled();
  });

  it("queries history and filters the visible recordings from the returned result set", async () => {
    historySearchMock.mockResolvedValue({
      matches: {
        alpha: { snippet: "...roadmap..." },
      },
      mode: "text",
      orderedIds: [],
    });

    const { result } = renderHook(
      () => useSearch({ embeddingsEnabled: true, recordings }),
      { wrapper: TestProvider },
    );

    act(() => {
      result.current.setSearch("roadmap");
    });

    await waitFor(() => {
      expect(historySearchMock).toHaveBeenCalledWith("roadmap", {
        useSemanticSearch: false,
      });
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual({
        alpha: { snippet: "...roadmap..." },
      });
      expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
        "alpha",
      ]);
      expect(result.current.pinnedItems).toEqual([]);
    });
  });

  it("applies the local history filter before search results are displayed", () => {
    const { result } = renderHook(
      () => useSearch({ embeddingsEnabled: true, recordings }),
      { wrapper: TestProvider },
    );

    act(() => {
      result.current.setHistoryFilter("unprocessed");
    });

    expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
      "beta",
    ]);
    expect(result.current.pinnedItems.map(([id]) => id)).toEqual([]);
  });

  it("tracks the active history grouping from settings", () => {
    const initialProps: {
      historyGroupBy: Settings["ui"]["historyGroupBy"];
    } = {
      historyGroupBy: "week",
    };

    const { result, rerender } = renderHook(
      ({
        historyGroupBy,
      }: {
        historyGroupBy: Settings["ui"]["historyGroupBy"];
      }) =>
        useSearch({
          embeddingsEnabled: true,
          historyGroupBy,
          recordings,
        }),
      {
        initialProps,
        wrapper: TestProvider,
      },
    );

    expect(result.current.historyGroupBy).toBe("week");

    act(() => {
      result.current.setHistoryGroupBy("none");
    });

    expect(result.current.historyGroupBy).toBe("none");

    rerender({ historyGroupBy: "month" });

    expect(result.current.historyGroupBy).toBe("month");

    rerender({ historyGroupBy: "day" });

    expect(result.current.historyGroupBy).toBe("day");
  });

  it("can switch to semantic search and expose the result ordering", async () => {
    historySearchMock.mockResolvedValue({
      matches: {
        gamma: { score: 0.91, snippet: "Discussed launch readiness" },
        alpha: { score: 0.67, snippet: "Captured launch risks" },
      },
      mode: "semantic",
      orderedIds: ["gamma", "alpha"],
    });

    const { result } = renderHook(
      () => useSearch({ embeddingsEnabled: true, recordings }),
      { wrapper: TestProvider },
    );

    act(() => {
      result.current.setUseSemanticSearch(true);
      result.current.setSearch("launch");
    });

    await waitFor(() => {
      expect(historySearchMock).toHaveBeenCalledWith("launch", {
        useSemanticSearch: true,
      });
    });

    await waitFor(() => {
      expect(result.current.orderedIds).toEqual(["gamma", "alpha"]);
      expect(result.current.searchMode).toBe("semantic");
      expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
        "gamma",
        "alpha",
      ]);
    });
  });

  it("filters recordings by all selected tags", () => {
    const { result } = renderHook(
      () => useSearch({ embeddingsEnabled: true, recordings }),
      { wrapper: TestProvider },
    );

    act(() => {
      result.current.toggleTagFilter("Roadmap");
    });

    expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
      "alpha",
      "beta",
    ]);

    act(() => {
      result.current.toggleTagFilter("Urgent");
    });

    expect(result.current.visibleRecordings.map(([id]) => id)).toEqual([
      "alpha",
    ]);
  });
});
