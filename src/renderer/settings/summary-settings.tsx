import React from "react";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTextField } from "./settings-text-field";
import { SettingsSelectField } from "./settings-select-field";
import { SettingsField } from "./settings-field";
import { mainApi } from "../api";
import { SettingsTab } from "./tabs";

export const OpenAiSettings: FC = () => {
  const form = useFormContext<Settings>();

  const useCustomUrl = form.watch("llm.providerConfig.openai.useCustomUrl");

  // Set baseURL to undefined when useCustomUrl is unselected
  React.useEffect(() => {
    if (!useCustomUrl) {
      form.setValue(
        "llm.providerConfig.openai.chatModel.configuration.baseURL",
        undefined,
      );
    }
  }, [useCustomUrl, form]);

  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        OpenAI ChatGPT Settings
      </Heading>

      <SettingsSwitchField
        label="Use Custom Endpoint"
        description="Use a custom OpenAI compatible endpoint instead of the official OpenAI API"
        form={form}
        field="llm.providerConfig.openai.useCustomUrl"
      />

      {useCustomUrl && (
        <SettingsTextField
          label="Base URL"
          {...form.register(
            "llm.providerConfig.openai.chatModel.configuration.baseURL",
            {
              required: "Base URL is required when using a custom endpoint",
              validate: (value) =>
                value === "" ? "Base URL cannot be empty" : true,
            },
          )}
        />
      )}

      <SettingsTextField
        label="API Key"
        description="OpenAI API Key"
        {...form.register("llm.providerConfig.openai.chatModel.apiKey")}
      />

      {form.watch("llm.providerConfig.openai.useCustomUrl") ? (
        <SettingsTextField
          label="Chat Model"
          {...form.register("llm.providerConfig.openai.chatModel.model")}
        />
      ) : (
        <SettingsSelectField
          label="Chat Model"
          field="llm.providerConfig.openai.chatModel.model"
          form={form}
          values={[
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-4-turbo-preview",
            "gpt-4-0125-preview",
            "gpt-4-1106-preview",
            "gpt-4",
            "gpt-4-0613",
            "gpt-4-32k",
            "gpt-4-32k-0613",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-0125",
            "gpt-3.5-turbo-1106",
            "gpt-3.5-turbo-instruct",
            "gpt-3.5-turbo-16k",
            "gpt-3.5-turbo-0613",
            "gpt-3.5-turbo-16k-0613",
          ]}
        />
      )}

      {form.watch("llm.providerConfig.openai.useCustomUrl") ? (
        <SettingsTextField
          label="Embeddings Model"
          {...form.register("llm.providerConfig.openai.embeddings.model")}
        />
      ) : (
        <SettingsSelectField
          label="Embeddings Model"
          field="llm.providerConfig.openai.embeddings.model"
          form={form}
          values={[
            "text-embedding-3-large",
            "text-embedding-3-small",
            "text-embedding-ada-002",
          ]}
        />
      )}

      <SettingsTextField
        label="Embedding Dimensions"
        type="number"
        {...form.register("llm.providerConfig.openai.embeddings.dimensions")}
      />

      <SettingsTextField
        label="Embedding Batch Size"
        type="number"
        {...form.register("llm.providerConfig.openai.embeddings.batchSize")}
      />
    </>
  );
};

export const OllamaSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Ollama Settings
      </Heading>
      <Text as="p" mb="1rem">
        You need to make sure that Ollama is installed locally, running and
        reachable.
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
        {...form.register(
          "llm.providerConfig.ollama.chatModel.configuration.baseURL",
        )}
      />

      <SettingsTextField
        label="Chat Model"
        {...form.register("llm.providerConfig.ollama.chatModel.model")}
      />

      <SettingsField label="Install Ollama">
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

      <SettingsTextField
        label="Embeddings Model"
        {...form.register("llm.providerConfig.ollama.embeddings.model")}
      />

      <SettingsTextField
        label="Embeddings Concurrency"
        type="number"
        {...form.register(
          "llm.providerConfig.ollama.embeddings.maxConcurrency",
        )}
      />
    </>
  );
};

export const DetailedSummarySettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
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
        enter an API key to have OpenAI ChatGPT API generate the summaries.
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

      {form.watch("llm.provider") === "ollama" && <OllamaSettings />}
      {form.watch("llm.provider") === "openai" && <OpenAiSettings />}
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
        offline only. You need to install Ollama on your machine and configure
        it here.
      </Text>
      <SettingsSwitchField
        label="Enable summarization"
        form={form}
        field="llm.enabled"
      />
      <SettingsSwitchField
        label="Use Embeddings"
        description="Create embeddings of the meeting transcript as context for the LLM. If disabled, the transcript will be passed in directly.
          Using embeddings can improve the quality of the summarization, but increase execution time."
        form={form}
        field="llm.useEmbedding"
      />
      <SettingsField label="Install Ollama">
        <Button
          type="button"
          onClick={async () => {
            await mainApi.openWeb("https://ollama.com/download");
          }}
        >
          Download and install Ollama
        </Button>
      </SettingsField>
      {form.watch("llm.enabled") && <DetailedSummarySettings />}
    </Tabs.Content>
  );
};
