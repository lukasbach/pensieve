import { useDebouncedState } from "@react-hookz/web";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { QueryKeys } from "../../query-keys";
import { RecordingMeta, Settings } from "../../types";
import { normalizeSelectedTags, normalizeTagName } from "../../tagging";
import { historyApi } from "../api";

export type HistoryFilter = "all" | "unprocessed" | "missingEmbeddings";

type HistoryGroupBy = Settings["ui"]["historyGroupBy"];

type UseSearchOptions = {
  embeddingsEnabled?: boolean;
  historyGroupBy?: HistoryGroupBy;
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

const matchesTagFilters = (tagFilters: string[], meta: RecordingMeta) => {
  if (tagFilters.length === 0) {
    return true;
  }

  const recordingTags = new Set(
    (meta.tags ?? []).map((tag) => normalizeTagName(tag).toLowerCase()),
  );

  return tagFilters.every((tag) =>
    recordingTags.has(normalizeTagName(tag).toLowerCase()),
  );
};

export const useSearch = ({
  embeddingsEnabled,
  historyGroupBy,
  recordings,
}: UseSearchOptions = {}) => {
  const [search, setSearch] = useDebouncedState("", 500, 1000);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [activeHistoryGroupBy, setHistoryGroupBy] = useState<HistoryGroupBy>(
    historyGroupBy ?? "day",
  );
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

  useEffect(() => {
    setHistoryGroupBy(historyGroupBy ?? "day");
  }, [historyGroupBy]);

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
          matchesTagFilters(tagFilters, meta) &&
          (!hasSearch || Boolean(searchResults[id])),
      ),
    [hasSearch, historyFilter, recordingList, searchResults, tagFilters],
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

  const toggleTagFilter = (tag: string) => {
    const normalizedTag = normalizeTagName(tag).toLowerCase();

    setTagFilters((current) => {
      if (
        current.some(
          (currentTag) =>
            normalizeTagName(currentTag).toLowerCase() === normalizedTag,
        )
      ) {
        return current.filter(
          (currentTag) =>
            normalizeTagName(currentTag).toLowerCase() !== normalizedTag,
        );
      }

      return normalizeSelectedTags([...current, tag]);
    });
  };

  return {
    historyFilter,
    historyGroupBy: activeHistoryGroupBy,
    orderedIds,
    pinnedItems,
    recordingList,
    search,
    searchMode,
    setSearch,
    searchResults,
    setHistoryFilter,
    setHistoryGroupBy,
    setUseSemanticSearch,
    tagFilters,
    toggleTagFilter,
    useSemanticSearch,
    visibleRecordings,
  };
};

export type HistoryMenuSearch = Pick<
  ReturnType<typeof useSearch>,
  | "historyFilter"
  | "historyGroupBy"
  | "setHistoryFilter"
  | "setHistoryGroupBy"
  | "tagFilters"
  | "toggleTagFilter"
>;
