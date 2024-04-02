import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";

export const FfmpegSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value="ffmpeg">
      {form.getValues()?.whisper?.model}
    </Tabs.Content>
  );
};
