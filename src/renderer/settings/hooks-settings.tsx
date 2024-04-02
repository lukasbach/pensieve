import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";

export const HooksSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value="hooks">
      {form.getValues()?.whisper?.model}
    </Tabs.Content>
  );
};
