import { FC, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { Settings } from "../../types";
import { SettingsField } from "./settings-field";
import { SettingsSelectField } from "./settings-select-field";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTab } from "./tabs";
import { SettingsTextField } from "./settings-text-field";

const openAiEmbeddingModels = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
  "Custom",
];

const OpenAiEmbeddingSettings: FC = () => {
  const form = useFormContext<Settings>();
  const [customModel, setCustomModel] = useState(false);
  const model = form.watch("embeddings.models.openai");

  useEffect(() => {
    if (model === "Custom") {
      form.setValue("embeddings.models.openai", "");
      setCustomModel(true);
    }
  }, [form, model]);

  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        OpenAI Embedding Model
      </Heading>
      <Text as="p" mb="1rem">
        OpenAI API keys and endpoint settings are configured in General
        Settings.
      </Text>

      {!customModel ? (
        <SettingsSelectField
          label="Embedding Model"
          field="embeddings.models.openai"
          form={form}
          values={openAiEmbeddingModels}
        />
      ) : (
        <>
          <SettingsTextField
            label="Embedding Model"
            {...form.register("embeddings.models.openai")}
          />

          <SettingsField>
            <Button
              type="button"
              onClick={() => {
                setCustomModel(false);
                form.setValue("embeddings.models.openai", openAiEmbeddingModels[0]);
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

const OllamaEmbeddingSettings: FC = () => {
  const form = useFormContext<Settings>();
  return (
    <>
      <Heading mt="4rem" as="h2" size="4">
        Ollama Embedding Model
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
        label="Embedding Model"
        {...form.register("embeddings.models.ollama")}
      />
    </>
  );
};

export const EmbeddingSettings: FC = () => {
  const form = useFormContext<Settings>();

  return (
    <Tabs.Content value={SettingsTab.Embeddings}>
      <Heading>Embeddings</Heading>
      <Text as="p" mb="1rem">
        Embeddings enable semantic search in the history view. They are created
        after transcription and stored alongside each recording as
        embedding.json metadata plus embedding.bin vector data.
      </Text>
      <Text as="p" mb="1rem">
        If you switch the embedding backend or model, existing recordings will
        need to compute embeddings again before they participate in semantic
        search with the new configuration.
      </Text>
      <SettingsSwitchField
        label="Enable embeddings"
        form={form}
        field="embeddings.enabled"
      />

      {form.watch("embeddings.enabled") && (
        <>
          <Heading mt="4rem" as="h2" size="4">
            Embedding Backend
          </Heading>
          <Text as="p" mb="1rem">
            You can compute embeddings with a local Ollama model or with an
            OpenAI compatible API. Shared API keys and endpoints are configured
            in General Settings.
          </Text>

          <Box position="relative">
            <RadioCards.Root
              defaultValue={form.getValues().embeddings.provider}
              onValueChange={(value) =>
                form.setValue(
                  "embeddings.provider",
                  value as "ollama" | "openai",
                )
              }
              columns={{ initial: "1", xs: "1", sm: "2", md: "3", lg: "6" }}
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
                  <Text>An OpenAI compatible embeddings API</Text>
                </Flex>
              </RadioCards.Item>
            </RadioCards.Root>
          </Box>

          {form.watch("embeddings.provider") === "ollama" && (
            <OllamaEmbeddingSettings />
          )}
          {form.watch("embeddings.provider") === "openai" && (
            <OpenAiEmbeddingSettings />
          )}
        </>
      )}
    </Tabs.Content>
  );
};
