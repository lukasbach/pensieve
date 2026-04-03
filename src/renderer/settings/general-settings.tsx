import { FC, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useFormContext } from "react-hook-form";
import { Button, Heading, Text } from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsField } from "./settings-field";
import { useWindowedConfirm } from "../dialog/context";
import { mainApi } from "../api";
import { SettingsTextField } from "./settings-text-field";
import { SettingsTab } from "./tabs";

const OpenAiProviderSettings: FC = () => {
  const form = useFormContext<Settings>();
  const useCustomUrl = form.watch("providers.openai.useCustomUrl");

  useEffect(() => {
    if (!useCustomUrl) {
      form.setValue("providers.openai.baseURL", undefined);
    }
  }, [form, useCustomUrl]);

  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        OpenAI Settings
      </Heading>
      <Text as="p" mb="1rem">
        These connection settings are shared by all OpenAI-backed features.
      </Text>

      <SettingsTextField
        label="API Key"
        description="OpenAI API Key"
        {...form.register("providers.openai.apiKey")}
      />

      <SettingsSwitchField
        label="Use Custom Endpoint"
        description="Use a custom OpenAI compatible endpoint instead of the official OpenAI API"
        form={form}
        field="providers.openai.useCustomUrl"
      />

      {useCustomUrl && (
        <SettingsTextField
          label="Base URL"
          {...form.register("providers.openai.baseURL", {
            required: "Base URL is required when using a custom endpoint",
            validate: (value) =>
              value === "" ? "Base URL cannot be empty" : true,
          })}
        />
      )}
    </>
  );
};

const OllamaProviderSettings: FC = () => {
  const form = useFormContext<Settings>();

  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Ollama Settings
      </Heading>
      <Text as="p" mb="1rem">
        These connection settings are shared by all Ollama-backed features. Make
        sure Ollama is installed locally, running and reachable.
      </Text>

      <SettingsField label="Install">
        <Button
          type="button"
          onClick={async () => {
            await mainApi.openWeb("https://ollama.com/download");
          }}
        >
          Download and install Ollama
        </Button>
      </SettingsField>

      <SettingsTextField
        label="Base URL"
        {...form.register("providers.ollama.baseUrl")}
      />

      <SettingsField label="Available Models">
        <Button
          type="button"
          variant="surface"
          onClick={async () => {
            await mainApi.openWeb("https://ollama.com/library");
          }}
        >
          Show available models
        </Button>
      </SettingsField>
    </>
  );
};

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

      <SettingsSwitchField
        form={form}
        field="ui.useOverlayTool"
        label="Use Recording overlay"
        description="When the Pensieve window is closed during recordings, a small overlay will be displayed to control the recording."
      />

      <SettingsTextField
        label="Recordings folder"
        description="The folder on your computer where recording data is stored."
        {...form.register("core.recordingsFolder")}
      />

      <OpenAiProviderSettings />
      <OllamaProviderSettings />
    </Tabs.Content>
  );
};
