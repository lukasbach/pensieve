import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useFormContext } from "react-hook-form";
import { Button } from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsField } from "./settings-field";
import { useWindowedConfirm } from "../dialog/context";
import { mainApi } from "../api";
import { SettingsTextField } from "./settings-text-field";
import { SettingsTab } from "./tabs";

export const GeneralSettings: FC = () => {
  const form = useFormContext<Settings>();
  const confirmReset = useWindowedConfirm(
    "Reset settings",
    "Are you sure you want to reset all settings to default settings?",
  );

  return (
    <Tabs.Content value={SettingsTab.General}>
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

      <SettingsSwitchField
        form={form}
        field="ui.autoStart"
        label="Start app on system startup"
        onCheckedChange={(value) => mainApi.setAutoStart(value)}
      />

      <SettingsTextField
        label="Recordings folder"
        description="The folder on your computer where recording data is stored."
        {...form.register("core.recordingsFolder")}
      />
    </Tabs.Content>
  );
};
