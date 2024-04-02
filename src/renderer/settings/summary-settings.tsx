import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";

export const SummarySettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value="summary">
      {form.getValues()?.whisper?.model}
    </Tabs.Content>
  );
};
