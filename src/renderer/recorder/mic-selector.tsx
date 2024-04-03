import { FC } from "react";
import { Select } from "@radix-ui/themes";
import { useRecorderState } from "./state";
import { useMicSources } from "./hooks";

export const MicSelector: FC = () => {
  const micSources = useMicSources();
  const { setConfig, recordingConfig } = useRecorderState();

  return (
    <Select.Root
      value={recordingConfig.mic?.deviceId}
      onValueChange={(value) => {
        const mic = micSources?.find((s) => s.deviceId === value);
        if (!mic) return;
        setConfig({ mic });
      }}
      disabled={!recordingConfig.mic}
    >
      <Select.Trigger
        style={{
          maxWidth: "-webkit-fill-available",
          minWidth: "-webkit-fill-available",
        }}
        placeholder="Microphone"
      />
      <Select.Content position="popper" style={{ maxWidth: "100%" }}>
        {micSources?.map((source) => (
          <Select.Item value={source.deviceId} key={source.deviceId}>
            {source.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
