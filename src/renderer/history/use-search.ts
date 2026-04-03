import { useDebouncedState } from "@react-hookz/web";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { RecordingMeta } from "../../types";

export type HistoryFilter = "all" | "unprocessed" | "missingEmbeddings";

type UseSearchOptions = {
  embeddingsEnabled?: boolean;
  recordings?: Record<string, RecordingMeta>;
};

const matchesHistoryFilter = (
  historyFilter: HistoryFilter,
  meta: RecordingMeta,
) => {
  switch (historyFilter) {
    case "unprocessed":
      return !meta.isPostProcessed;
    case "missingEmbeddings":
      return !meta.hasEmbedding;
    default:
      return true;
  }
};

export const useSearch = ({
  embeddingsEnabled,
  recordings,
}: UseSearchOptions = {}) => {
  const [search, setSearch] = useDebouncedState("", 500, 1000);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const emptySearchResponse: Awaited<ReturnType<typeof historyApi.search>> = {
    matches: {},
    mode: useSemanticSearch ? "semantic" : "text",
    orderedIds: [],
  };

  useEffect(() => {
    if (!embeddingsEnabled && useSemanticSearch) {
      setUseSemanticSearch(false);
    }
  }, [embeddingsEnabled, useSemanticSearch]);

  const { data } = useQuery({
    queryKey: [QueryKeys.History, search, useSemanticSearch],
    queryFn: async () =>
      search
        ? historyApi.search(search, { useSemanticSearch })
        : emptySearchResponse,
  });
  const hasSearch = search.length > 0;
  const orderedIds = data?.orderedIds ?? emptySearchResponse.orderedIds;
  const searchMode = data?.mode ?? emptySearchResponse.mode;
  const searchResults = data?.matches ?? emptySearchResponse.matches;

  const recordingList = useMemo(
    () =>
      recordings
        ? Object.entries(recordings).sort(
            ([, a], [, b]) =>
              new Date(b.started).getTime() - new Date(a.started).getTime(),
          )
        : [],
    [recordings],
  );

  const filteredRecordings = useMemo(
    () =>
      recordingList.filter(
        ([id, meta]) =>
          matchesHistoryFilter(historyFilter, meta) &&
          (!hasSearch || Boolean(searchResults[id])),
      ),
    [hasSearch, historyFilter, recordingList, searchResults],
  );

  const visibleRecordings = useMemo(() => {
    if (!hasSearch || searchMode !== "semantic") {
      return filteredRecordings;
    }

    const filteredRecordingsById = new Map(filteredRecordings);
    return orderedIds.flatMap((recordingId) => {
      const recording = filteredRecordingsById.get(recordingId);
      return recording ? ([[recordingId, recording]] as const) : [];
    });
  }, [filteredRecordings, hasSearch, orderedIds, searchMode]);

  const pinnedItems = useMemo(
    () =>
      hasSearch ? [] : filteredRecordings.filter(([, meta]) => meta.isPinned),
    [filteredRecordings, hasSearch],
  );

  return {
    historyFilter,
    orderedIds,
    pinnedItems,
    recordingList,
    search,
    searchMode,
    setSearch,
    searchResults,
    setHistoryFilter,
    setUseSemanticSearch,
    useSemanticSearch,
    visibleRecordings,
  };
};

export type HistoryMenuSearch = Pick<
  ReturnType<typeof useSearch>,
  "historyFilter" | "setHistoryFilter"
>;
