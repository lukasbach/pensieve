import { FC } from "react";
import { Button, Select } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useRecorderState, useStopRecording } from "./state";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";

export const Recorder: FC = () => {
  const { data: screenSources } = useQuery({
    queryKey: [QueryKeys.ScreenSources],
    queryFn: mainApi.getSources,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
  const { data: micSources } = useQuery({
    queryKey: [QueryKeys.ScreenSources],
    queryFn: navigator.mediaDevices.enumerateDevices,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const { setConfig, recordingConfig, startRecording, recorder } =
    useRecorderState();
  const stopRecording = useStopRecording();
  return (
    <>
      <Select.Root
        value={recordingConfig.screen?.id}
        onValueChange={(value) => {
          const screen = screenSources?.find((s) => s.id === value);
          if (!screen) return;
          setConfig({ screen });
        }}
      >
        <Select.Trigger />
        <Select.Content>
          {screenSources?.map((source) => (
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
