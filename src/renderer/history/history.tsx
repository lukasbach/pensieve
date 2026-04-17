import { FC, useMemo } from "react";
import { Box, Flex, IconButton, TextField, Tooltip } from "@radix-ui/themes";
import { HiSparkles } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";
import { HistoryMenu } from "./history-menu";
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
          {search.pinnedItems.map(([id, meta], idx, arr) => (
            <HistoryItem
              key={id}
              id={id}
              recording={meta}
              priorItemDate={arr[idx - 1]?.[1].started}
              searchText={search.searchResults[id]?.snippet}
              isProcessing={processingRecordings.has(id)}
              isPinnedItem
            />
          ))}
          <Box mb="3rem" />
        </>
      )}

      {search.visibleRecordings.map(([id, meta], idx, arr) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          priorItemDate={
            search.search.length ? meta.started : arr[idx - 1]?.[1].started
          }
          searchText={search.searchResults[id]?.snippet}
          isProcessing={processingRecordings.has(id)}
        />
      ))}
    </Box>
  );
};
