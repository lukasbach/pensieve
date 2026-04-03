import { FC, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Box,
  Button,
  Flex,
  Heading,
  RadioCards,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTextField } from "./settings-text-field";
import { SettingsSelectField } from "./settings-select-field";
import { SettingsField } from "./settings-field";
import { SettingsTab } from "./tabs";

const openAiModels = [
  "gpt-5",
  "gpt-5-nano",
  "gpt-5-mini",
  "gpt-5-chat-latest",
  "gpt-4.1",
  "gpt-4o",
  "o4-mini",
  "o3",
  "o3-pro",
  "o3-mini",
  "o1",
  "o1-pro",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o-mini",
  "Custom",
];

const OpenAiSummaryModelSettings: FC = () => {
  const form = useFormContext<Settings>();
  const [customModel, setCustomModel] = useState(false);
  const model = form.watch("llm.models.openai");

  useEffect(() => {
    if (model === "Custom") {
      form.setValue("llm.models.openai", "");
      setCustomModel(true);
    }
  }, [form, model]);

  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        OpenAI Model
      </Heading>
      <Text as="p" mb="1rem">
        OpenAI API keys and endpoint settings are configured in General
        Settings.
      </Text>

      {!customModel ? (
        <SettingsSelectField
          label="Chat Model"
          field="llm.models.openai"
          form={form}
          values={openAiModels}
        />
      ) : (
        <>
          <SettingsTextField
            label="Chat Model"
            {...form.register("llm.models.openai")}
          />

          <SettingsField>
            <Button
              type="button"
              onClick={() => {
                setCustomModel(false);
                form.setValue("llm.models.openai", openAiModels[0]);
              }}
            >
              Use default OpenAI models
            </Button>
          </SettingsField>
        </>
      )}
    </>
  );
};

const OllamaSummaryModelSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Ollama Model
      </Heading>
      <Text as="p" mb="1rem">
        Ollama installation and endpoint settings are configured in General
        Settings.
      </Text>
      <SettingsTextField
        label="Base URL"
        disabled
        value={form.watch("providers.ollama.baseUrl")}
      />

      <SettingsTextField
        label="Chat Model"
        {...form.register("llm.models.ollama")}
      />
    </>
  );
};

export const DetailedSummarySettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <SettingsField label="Additional prompt">
        <TextArea
          resize="vertical"
          rows={4}
          placeholder="Create the summary in german, use short easy-to-understand sentences…"
          {...form.register("llm.prompt")}
        />
      </SettingsField>
      <Heading mt="4rem" as="h2" size="4">
        Enabled Features
      </Heading>
      <SettingsSwitchField
        label="Generate summary"
        form={form}
        field="llm.features.summary"
      />
      <SettingsSwitchField
        label="Extract action items"
        form={form}
        field="llm.features.actionItems"
      />
      <SettingsSwitchField
        label="Generate single-sentence summary"
        description="The single-sentence summary will be displayed in the history view for each recording."
        form={form}
        field="llm.features.sentenceSummary"
      />

      <Heading mt="4rem" as="h2" size="4">
        LLM Backend
      </Heading>
      <Text as="p" mb="1rem">
        You can select a locally running LLM that is hosted through Ollama, or
        use OpenAI. Shared API keys and endpoints are configured in General
        Settings.
      </Text>

      <Box position="relative">
        <RadioCards.Root
          defaultValue={form.getValues()?.llm.provider}
          onValueChange={(v) =>
            form.setValue("llm.provider", v as "ollama" | "openai")
          }
          columns={{ initial: "1", xs: "1", sm: "2", md: "3", lg: "7" }}
          mt="1rem"
        >
          <RadioCards.Item value="ollama">
            <Flex direction="column" width="100%">
              <Text weight="bold">Ollama</Text>
              <Text>A locally running Ollama instance</Text>
            </Flex>
          </RadioCards.Item>
          <RadioCards.Item value="openai">
            <Flex direction="column" width="100%">
              <Text weight="bold">OpenAI</Text>
              <Text>An OpenAI ChatGPT API</Text>
            </Flex>
          </RadioCards.Item>
        </RadioCards.Root>
      </Box>

      {form.watch("llm.provider") === "ollama" && (
        <OllamaSummaryModelSettings />
      )}
      {form.watch("llm.provider") === "openai" && (
        <OpenAiSummaryModelSettings />
      )}
    </>
  );
};

export const SummarySettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <Tabs.Content value={SettingsTab.Summary} style={{ height: "100%" }}>
      <Heading>Summarization</Heading>
      <Text as="p" mb="1rem">
        A LLM model can be used to summarize the transcript and extract action
        items. Note that this is resource intensive, and the quality of the
        outcome depends on the LLM that is used, and how good the generated
        transcript is, thus also which Whisper model was used to generate the
        transcript.
      </Text>
      <Text as="p" mb="1rem">
        If enabled, summarization will happen as part of the postprocessing,
        after the transcription has finished.
      </Text>
      <Text as="p" mb="1rem">
        If you want all your data to stay locally, using Ollama for
        summarization is a good choice. It will download and run LLM models
        offline only. You can configure shared Ollama and OpenAI connection
        settings in General Settings.
      </Text>
      <SettingsSwitchField
        label="Enable summarization"
        form={form}
        field="llm.enabled"
      />
      {form.watch("llm.enabled") && <DetailedSummarySettings />}
    </Tabs.Content>
  );
};
