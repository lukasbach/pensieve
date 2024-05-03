import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Button,
  Dialog,
  Flex,
  Heading,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { SettingsTab } from "./tabs";
import { SettingsSwitchField } from "./settings-switch-field";
import { Settings } from "../../types";
import { SettingsTextField } from "./settings-text-field";
import { SettingsField } from "./settings-field";
import { mainApi } from "../api";
import { useWindowedConfirm } from "../dialog/context";
import { datahookMarkdownTemplate } from "../../datahooks-defaults";

const JsonSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Export JSON
      </Heading>
      <Text as="p" mb="1rem">
        This will dump a JSON file with the recording data, full transcript and
        summarization results.
      </Text>
      <SettingsSwitchField
        label="Export JSON File"
        form={form}
        field="datahooks.features.exportJson"
      />
      {form.watch("datahooks.features.exportJson") && (
        <SettingsTextField
          label="JSON Export Path"
          {...form.register("datahooks.jsonPath")}
        />
      )}
    </>
  );
};

const Mp3Settings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Export MP3 Recording
      </Heading>
      <Text as="p" mb="1rem">
        This will copy the created MP3 file from the recording.
      </Text>
      <SettingsSwitchField
        label="Export MP3 File"
        form={form}
        field="datahooks.features.exportMp3"
      />
      {form.watch("datahooks.features.exportMp3") && (
        <SettingsTextField
          label="MP3 Export Path"
          {...form.register("datahooks.mp3Path")}
        />
      )}
    </>
  );
};

const AssetsSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Export Screenshots
      </Heading>
      <Text as="p" mb="1rem">
        This will copy all created screenshots from the recording. The path
        specified below will be evaluated for each asset individually.
      </Text>
      <SettingsSwitchField
        label="Export Screenshots"
        form={form}
        field="datahooks.features.exportAssets"
      />
      {form.watch("datahooks.features.exportAssets") && (
        <SettingsTextField
          label="Assets Export Path"
          {...form.register("datahooks.assetPath")}
        />
      )}
    </>
  );
};

const CmdletSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Run Shell Command after processing
      </Heading>
      <Text as="p" mb="1rem">
        The following command will be run after each recording is processed. You
        can use this to trigger external scripts, notifications or other
        integrations.
      </Text>
      <SettingsSwitchField
        label="Run Shell Command"
        form={form}
        field="datahooks.features.callCmdlet"
      />
      {form.watch("datahooks.features.callCmdlet") && (
        <SettingsTextField
          label="Command"
          {...form.register("datahooks.callCmdlet")}
        />
      )}
    </>
  );
};

const MarkdownSettings: FC = () => {
  const confirmReset = useWindowedConfirm(
    "Reset Markdown Template",
    "Are you sure you want to reset the markdown template?",
  );
  const form = useFormContext<Settings>();
  return (
    <Dialog.Root>
      <Dialog.Content>
        <Dialog.Title>Edit Markdown Template</Dialog.Title>
        <Dialog.Description>
          <TextArea
            resize="vertical"
            rows={20}
            placeholder="Markdown template…"
            {...form.register("datahooks.markdownTemplate")}
          />
        </Dialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <Button
            variant="soft"
            color="gray"
            onClick={async () => {
              await confirmReset();
              form.setValue(
                "datahooks.markdownTemplate",
                datahookMarkdownTemplate,
              );
            }}
          >
            Reset to default
          </Button>
          <Dialog.Close>
            <Button>Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
      <Heading mt="4rem" as="h2" size="4">
        Export Markdown file
      </Heading>
      <Text as="p" mb="1rem">
        This will create a markdown file with data from the recording and
        transcription. You can customize the template for the markdown contents
        below.
      </Text>
      <SettingsSwitchField
        label="Export Markdown file"
        form={form}
        field="datahooks.features.exportMarkdown"
      />
      {form.watch("datahooks.features.exportMarkdown") && (
        <>
          <SettingsTextField
            label="Markdown Export Path"
            {...form.register("datahooks.markdownPath")}
          />
          <SettingsField label="Template">
            <Dialog.Trigger>
              <Button type="button" variant="solid">
                Edit Markdown Template
              </Button>
            </Dialog.Trigger>
          </SettingsField>
          <SettingsField label="Templating Spec">
            <Button
              type="button"
              variant="surface"
              onClick={async () => {
                await mainApi.openWeb(
                  "https://github.com/lukasbach/pensieve/blob/main/docs/datahooks-templating.md",
                );
              }}
            >
              Show Templating Specification
            </Button>
          </SettingsField>
        </>
      )}
    </Dialog.Root>
  );
};

export const HooksSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value={SettingsTab.Hooks}>
      <Heading>Data hooks</Heading>
      <Text as="p" mb="1rem">
        Data hooks allow you to automatically copy recording data out of the app
        to customizable locations, everytime a recording is processed. You can
        have the data hook export markdown files from the transcription, the MP3
        recording and more. The hook automatically runs when a recording is
        processed, and can optionally be manually run from the recording context
        menu in the history page, which is useful for testing out your data
        hook.
      </Text>
      <SettingsSwitchField
        label="Enable Datahooks"
        form={form}
        field="datahooks.enabled"
      />
      <Text as="p" mb="1rem" mt="1rem">
        Both the paths for exported files and the markdown contents allow you to
        customize the value based on the specifics on each recording with
        handlebar templates. You can view an guide on how to do that, along a
        specification of available variables, by clicking the button below.
      </Text>
      <SettingsField label="Templating Spec">
        <Button
          type="button"
          variant="surface"
          onClick={async () => {
            await mainApi.openWeb(
              "https://github.com/lukasbach/pensieve/blob/main/docs/datahooks-templating.md",
            );
          }}
        >
          Show Templating Specification
        </Button>
      </SettingsField>
      {form.watch("datahooks.enabled") && <MarkdownSettings />}
      {form.watch("datahooks.enabled") && <JsonSettings />}
      {form.watch("datahooks.enabled") && <Mp3Settings />}
      {form.watch("datahooks.enabled") && <AssetsSettings />}
      {form.watch("datahooks.enabled") && <CmdletSettings />}
    </Tabs.Content>
  );
};
