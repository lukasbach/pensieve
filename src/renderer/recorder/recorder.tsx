import { FC } from "react";
import { Button, Select } from "@radix-ui/themes";
import { useLoadSources, useRecorderState, useStopRecording } from "./state";

export const Recorder: FC = () => {
  const {
    sources,
    setSelectedSource,
    selectedSource,
    startRecording,
    recorder,
  } = useRecorderState();
  const stopRecording = useStopRecording();
  useLoadSources();
  return (
    <>
      <Select.Root
        value={selectedSource?.id}
        onValueChange={(value) => {
          const source = sources?.find((s) => s.id === value);
          if (!source) return;
          setSelectedSource(source);
        }}
      >
        <Select.Trigger />
        <Select.Content>
          {sources?.map((source) => (
            <Select.Item value={source.id} key={source.id}>
              {source.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {!recorder && <Button onClick={startRecording}>Start recording</Button>}
      {recorder && <Button onClick={stopRecording}>Stop recording</Button>}
    </>
  );
};
