import { FC, useMemo } from "react";
import { Box, TextField } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";
import { useSearch } from "./use-search";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  const { setSearch, searchResults, filter } = useSearch();
  const recordingList = useMemo(
    () => Object.entries(recordings || {}),
    [recordings],
  );
  return (
    <Box p="1rem">
      <TextField.Root
        placeholder="Search recordings..."
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      {recordingList.filter(filter).map(([id, meta], idx, arr) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          priorItemDate={arr[idx - 1]?.[1].started}
          searchText={searchResults?.[id] as string}
        />
      ))}
    </Box>
  );
};
