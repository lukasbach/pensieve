import { FC, useMemo } from "react";
import { Box, Button } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { mainApi, modelsApi } from "../api";
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
      <Button
        onClick={async () =>
          modelsApi
            .downloadModel((await mainApi.getSettings()).whisper.model)
            .then(() => console.log("Download done"))
        }
      >
        Download model
      </Button>
      <Button onClick={() => mainApi.openSettingsWindow()}>Settings</Button>
    </Box>
  );
};
