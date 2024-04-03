import { FC } from "react";
import { Select } from "@radix-ui/themes";
import { useRecorderState } from "./state";
import { useScreenSources } from "./hooks";

export const ScreenSelector: FC = () => {
  const screenSources = useScreenSources();
  const { setConfig, recordingConfig } = useRecorderState();

  return (
    <Select.Root
      value={recordingConfig.screen?.id}
      onValueChange={(value) => {
        const screen = screenSources?.find((s) => s.id === value);
        if (!screen) return;
        setConfig({ screen });
      }}
      disabled={!recordingConfig.screen}
    >
      <Select.Trigger
        style={{
          maxWidth: "-webkit-fill-available",
          minWidth: "-webkit-fill-available",
        }}
        placeholder="Screen"
      />
      <Select.Content position="popper">
        {screenSources?.map((source) => (
          <Select.Item value={source.id} key={source.id}>
            {/* `${source.name.slice(0, 50)}${source.name.length > 50 ? "..." : ""}` */}
            {source.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
