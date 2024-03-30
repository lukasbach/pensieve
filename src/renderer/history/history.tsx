import { FC } from "react";
import { Button } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { mainApi, modelsApi } from "../api";

export const History: FC<{}> = ({}) => {
  const { data: recordings } = useHistoryRecordings();
  return (
    <>
      <h1>Recordings</h1>
      <ul>
        {Object.entries(recordings || {}).map(([id, meta]) => (
          <li key={id}>
            {new Date(meta.started).toLocaleString()}
            {!meta.isPostProcessed && (
              <Button
                onClick={() =>
                  mainApi
                    .postProcessRecording(id)
                    .then(() => console.log("DONE"))
                }
              >
                Post Process
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Button
        onClick={() =>
          modelsApi
            .downloadModel("ggml-large-v3-q5_0")
            .then(() => console.log("Download done"))
        }
      >
        Download model
      </Button>
    </>
  );
};
