import { FC, useMemo } from "react";
import {
  Box,
  DropdownMenu,
  Flex,
  IconButton,
  TextField,
} from "@radix-ui/themes";
import { HiMiniBars3, HiOutlineArrowDownOnSquare } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";
import { useSearch } from "./use-search";
import { historyApi } from "../api";
import { useWindowedPromptText } from "../dialog/context";
import { QueryKeys } from "../../query-keys";
import { EmptyState } from "../common/empty-state";
import { EntityTitle } from "../common/entity-title";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  const { data: postprocessing } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });
  const { setSearch, searchResults, filter } = useSearch();
  const recordingList = useMemo(
    () => Object.entries(recordings || {}),
    [recordings],
  );

  const processingRecordings = useMemo(
    () =>
      new Set(
        postprocessing?.processingQueue
          .filter(({ isDone }) => !isDone)
          .map(({ recordingId }) => recordingId) ?? [],
      ),
    [postprocessing?.processingQueue],
  );

  const askImportName = useWindowedPromptText(
    "Import audio file",
    "Name of the recording",
  );
  const askImportDate = useWindowedPromptText(
    "Import audio file",
    "Date of the recording",
  );

  const pinnedItems = recordingList
    .filter(([, meta]) => meta.isPinned)
    .filter(filter);

  return (
    <Box p="1rem">
      <Flex gap=".5rem">
        <TextField.Root
          style={{ flexGrow: "1" }}
          placeholder="Search recordings..."
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="outline" color="gray">
              <HiMiniBars3 />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              onClick={async () => {
                const file = await historyApi.showOpenImportDialog();
                if (!file) return;
                const name = await askImportName(
                  file.filePath.split("/").at(-1)?.split("\\").at(-1) ??
                    "Untitled import",
                );
                if (!name) return;
                const started = await askImportDate(new Date().toISOString());
                if (!started) return;
                await historyApi.importRecording(file.filePath, {
                  name,
                  started,
                });
              }}
            >
              <HiOutlineArrowDownOnSquare /> Import audio file
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {recordingList.length === 0 && (
        <EmptyState
          title="No recordings yet"
          description='Record your first item under the "Record" tab.'
        />
      )}

      {pinnedItems.length > 0 && (
        <>
          <EntityTitle mb=".5rem" mt="1rem">
            Pinned recordings
          </EntityTitle>
          {pinnedItems.map(([id, meta], idx, arr) => (
            <HistoryItem
              key={id}
              id={id}
              recording={meta}
              priorItemDate={arr[idx - 1]?.[1].started}
              searchText={searchResults?.[id] as string}
              isProcessing={processingRecordings.has(id)}
              isPinnedItem
            />
          ))}
          <Box mb="3rem" />
        </>
      )}

      {recordingList.filter(filter).map(([id, meta], idx, arr) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          priorItemDate={arr[idx - 1]?.[1].started}
          searchText={searchResults?.[id] as string}
          isProcessing={processingRecordings.has(id)}
        />
      ))}
    </Box>
  );
};
