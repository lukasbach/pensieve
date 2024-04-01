import { FC } from "react";
import { Box, Button } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { modelsApi } from "../api";
import { HistoryItem } from "./history-item";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  return (
    <Box p="1rem">
      {Object.entries(recordings || {}).map(([id, meta]) => (
        <HistoryItem key={id} id={id} recording={meta} />
      ))}
      <Button
        onClick={() =>
          modelsApi
            .downloadModel("ggml-large-v3-q5_0")
            .then(() => console.log("Download done"))
        }
      >
        Download model
      </Button>
    </Box>
  );
};
