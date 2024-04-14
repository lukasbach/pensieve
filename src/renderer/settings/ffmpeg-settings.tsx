import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTextField } from "./settings-text-field";
import { SettingsTab } from "./tabs";

export const FfmpegSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value={SettingsTab.Ffmpeg}>
      <SettingsSwitchField
        form={form}
        field="ffmpeg.autoTriggerPostProcess"
        label="Automatically post-process audio"
        description="Transcription and summarization will be
          triggered automatically after recording is completed.
          This may be resource-intensive. Disable to manually
          trigger post-processing from the history view."
      />

      <SettingsSwitchField
        form={form}
        field="ffmpeg.removeRawRecordings"
        label="Clean up raw recordings"
        description="After post-processing, initial recording
          files will be removed. Disable to allow re-processing
          recordings afterwards with different settings."
      />

      <SettingsTextField
        label="FFMPEG Filter for Whisper-input"
        description="The FFMPEG complex audio filter applied to the
          input file of whisper."
        {...form.register("ffmpeg.stereoWavFilter")}
      />

      <SettingsTextField
        label="FFMPEG Filter for MP3 creation"
        description="The FFMPEG complex audio filter to the creation
          of MP3 recordings."
        {...form.register("ffmpeg.mp3Filter")}
      />
    </Tabs.Content>
  );
};
