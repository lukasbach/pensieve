import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { DataList, Switch } from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { Settings } from "../../types";

export const GeneralSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value="general">
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Dark mode</DataList.Label>
          <DataList.Label>
            <Switch
              defaultChecked={form.getValues()?.ui?.dark}
              onCheckedChange={(value) => form.setValue("ui.dark", value)}
            />
          </DataList.Label>
        </DataList.Item>
      </DataList.Root>
    </Tabs.Content>
  );
};
