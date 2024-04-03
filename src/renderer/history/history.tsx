import { FC, useMemo } from "react";
import { Box } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  const recordingList = useMemo(
    () => Object.entries(recordings || {}),
    [recordings],
  );
  return (
    <Box p="1rem">
      {recordingList.map(([id, meta], idx, arr) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          priorItemDate={arr[idx - 1]?.[1].started}
        />
      ))}
    </Box>
  );
};
