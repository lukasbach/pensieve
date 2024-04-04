import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useFormContext } from "react-hook-form";
import { Button } from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsField } from "./settings-field";
import { useConfirm } from "../dialog/context";
import { mainApi } from "../api";

export const GeneralSettings: FC = () => {
  const form = useFormContext<Settings>();
  const confirmReset = useConfirm(
    "Reset settings",
    "Are you sure you want to reset all settings to default settings?",
  );

  return (
    <Tabs.Content value="general">
      <SettingsField label="Reset settings">
        <Button
          onClick={async () => {
            await confirmReset();
            await mainApi.resetSettings();
            // TODO confirm flashes during first click
          }}
        >
          Reset
        </Button>
      </SettingsField>
      <SettingsSwitchField form={form} field="ui.dark" label="Dark mode" />
    </Tabs.Content>
  );
};
