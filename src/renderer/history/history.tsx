import { FC } from "react";
import { Box, Button } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { mainApi, modelsApi } from "../api";
import { HistoryItem } from "./history-item";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  return (
    <Box p="1rem">
      {Object.entries(recordings || {}).map(([id, meta]) => (
        <HistoryItem key={id} id={id} recording={meta} />
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
