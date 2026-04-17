import { FC, useMemo } from "react";
import { Box, Flex, IconButton, TextField, Tooltip } from "@radix-ui/themes";
import { HiSparkles } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";
import { HistoryMenu } from "./history-menu";
import { getHistoryGroup } from "./get-history-group";
import { useSearch } from "./use-search";
import { historyApi } from "../api";
import { useSettings } from "../common/use-settings";
import { QueryKeys } from "../../query-keys";
import { EmptyState } from "../common/empty-state";
import { EntityTitle } from "../common/entity-title";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  const { data: postprocessing } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });
  const { settings } = useSettings();
  const embeddingsEnabled = settings?.embeddings?.enabled ?? false;
  const search = useSearch({
    embeddingsEnabled,
    historyGroupBy: settings?.ui.historyGroupBy,
    recordings,
  });

  const processingRecordings = useMemo(
    () =>
      new Set(
        postprocessing?.processingQueue
          .filter(({ isDone }) => !isDone)
          .map(({ recordingId }) => recordingId) ?? [],
      ),
    [postprocessing?.processingQueue],
  );

  const groupedVisibleRecordings = useMemo(() => {
    if (search.search.length > 0) {
      return search.visibleRecordings.map(([id, meta]) => ({
        groupLabel: undefined,
        id,
        meta,
      }));
    }

    let previousGroupKey: string | null = null;
    return search.visibleRecordings.map(([id, meta]) => {
      const group = getHistoryGroup(meta.started, search.historyGroupBy);
      const groupLabel =
        !group || group.key === previousGroupKey ? undefined : group.label;

      previousGroupKey = group?.key ?? previousGroupKey;

      return {
        groupLabel,
        id,
        meta,
      };
    });
  }, [search.historyGroupBy, search.search.length, search.visibleRecordings]);

  return (
    <Box p="1rem">
      <Flex gap=".5rem">
        <TextField.Root
          style={{ flexGrow: "1" }}
          placeholder="Search recordings..."
          onChange={(e) => search.setSearch(e.currentTarget.value)}
        />

        {embeddingsEnabled && (
          <Tooltip
            content={
              search.useSemanticSearch
                ? "Semantic search is enabled"
                : "Use semantic search"
            }
          >
            <IconButton
              color={search.useSemanticSearch ? "blue" : "gray"}
              variant={search.useSemanticSearch ? "solid" : "outline"}
              onClick={() => search.setUseSemanticSearch((value) => !value)}
            >
              <HiSparkles />
            </IconButton>
          </Tooltip>
        )}

        <HistoryMenu search={search} />
      </Flex>

      {search.recordingList.length === 0 && (
        <EmptyState
          title="No recordings yet"
          description='Record your first item under the "Record" tab.'
        />
      )}

      {search.recordingList.length > 0 &&
        search.visibleRecordings.length === 0 && (
          <EmptyState
            title="No matching recordings"
            description="Try a different search or switch the active filter."
          />
        )}

      {search.pinnedItems.length > 0 && (
        <>
          <EntityTitle mb=".5rem" mt="1rem">
            Pinned recordings
          </EntityTitle>
          {search.pinnedItems.map(([id, meta]) => (
            <HistoryItem
              key={id}
              id={id}
              recording={meta}
              searchText={search.searchResults[id]?.snippet}
              isProcessing={processingRecordings.has(id)}
              isPinnedItem
            />
          ))}
          <Box mb="3rem" />
        </>
      )}

      {groupedVisibleRecordings.map(({ groupLabel, id, meta }) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          groupLabel={groupLabel}
          searchText={search.searchResults[id]?.snippet}
          isProcessing={processingRecordings.has(id)}
        />
      ))}
    </Box>
  );
};
