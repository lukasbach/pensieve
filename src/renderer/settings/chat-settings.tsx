import { FC, useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Box, Button, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { Settings } from "../../types";
import { SettingsField } from "./settings-field";
import { SettingsSelectField } from "./settings-select-field";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTab } from "./tabs";
import { SettingsTextField } from "./settings-text-field";
import { openAiChatModels } from "./openai-chat-models";

const OpenAiChatSettings: FC = () => {
  const form = useFormContext<Settings>();
  const model = form.watch("chat.models.openai");
  const [customModel, setCustomModel] = useState(
    Boolean(model) && !openAiChatModels.includes(model),
  );

  useEffect(() => {
    if (model === "Custom") {
      form.setValue("chat.models.openai", "");
      setCustomModel(true);
      return;
    }

    if (model && !openAiChatModels.includes(model)) {
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
          field="chat.models.openai"
          form={form}
          values={openAiChatModels}
        />
      ) : (
        <>
          <SettingsTextField
            label="Chat Model"
            {...form.register("chat.models.openai")}
          />

          <SettingsField>
            <Button
              type="button"
              onClick={() => {
                setCustomModel(false);
                form.setValue("chat.models.openai", openAiChatModels[0]);
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

const OllamaChatSettings: FC = () => {
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
        {...form.register("chat.models.ollama")}
      />
    </>
  );
};

export const ChatSettings: FC = () => {
  const form = useFormContext<Settings>();

  return (
    <Tabs.Content value={SettingsTab.Chat}>
      <Heading>Chat</Heading>
      <Text as="p" mb="1rem">
        The Chat tab lets you ask an LLM questions about your recordings. It
        uses the same recording lookup tools as the MCP server, without the
        ability to open recordings directly.
      </Text>
      <Text as="p" mb="1rem">
        Shared OpenAI and Ollama connection settings live in General Settings.
      </Text>
      <SettingsSwitchField
        label="Enable chat"
        form={form}
        field="chat.enabled"
      />

      {form.watch("chat.enabled") && (
        <>
          <Heading mt="4rem" as="h2" size="4">
            Chat Backend
          </Heading>
          <Text as="p" mb="1rem">
            Choose whether the embedded chat should use a local Ollama model or
            an OpenAI compatible chat model.
          </Text>

          <Box position="relative">
            <RadioCards.Root
              defaultValue={form.getValues().chat.provider}
              onValueChange={(value) =>
                form.setValue("chat.provider", value as "ollama" | "openai")
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
                  <Text>An OpenAI compatible chat API</Text>
                </Flex>
              </RadioCards.Item>
            </RadioCards.Root>
          </Box>

          {form.watch("chat.provider") === "ollama" && <OllamaChatSettings />}
          {form.watch("chat.provider") === "openai" && <OpenAiChatSettings />}
        </>
      )}
    </Tabs.Content>
  );
};
