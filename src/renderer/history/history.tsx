import { FC } from "react";
import { Button } from "@radix-ui/themes";
import { useHistoryRecordings } from "./state";
import { mainApi } from "../api";

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
              <Button onClick={() => mainApi.postProcessRecording(id)}>
                Post Process
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};
