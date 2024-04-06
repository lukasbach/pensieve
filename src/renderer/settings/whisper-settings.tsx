import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Badge, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { modelData } from "../../model-data";
import { Settings } from "../../types";
import { QueryKeys } from "../../query-keys";
import { modelsApi } from "../api";
import { SettingsTextField } from "./settings-text-field";
import { SettingsSwitchField } from "./settings-switch-field";

export const WhisperSettings: FC = () => {
  const form = useFormContext<Settings>();

  const { data: installedModels } = useQuery({
    queryKey: [QueryKeys.HasModel],
    queryFn: modelsApi.listModels,
  });

  console.log(
    form.register("whisper.processors"),
    form.getValues()?.whisper?.processors,
  );

  return (
    <Tabs.Content value="whisper">
      <Heading>Whisper transcription model</Heading>
      <Text as="p">
        The whisper AI model that is used to transcribe the audio file. If the
        model is not yet downloaded, it will be downloaded the first time it is
        used. Larger models have higher CPU and RAM demands, but produce better
        results.
      </Text>
      <Text as="p" mt=".3rem">
        Quantized models are smaller and faster, with only small reductions in
        accuracy, and are recommended for most users. English models are
        optimized for English language audio files.
      </Text>
      {/* <TextField.Root {...form.register("whisper.model")} /> */}

      <RadioCards.Root
        defaultValue={form.getValues()?.whisper?.model}
        onValueChange={(v) => form.setValue("whisper.model", v)}
        columns={{ initial: "1", xs: "1", sm: "2", md: "3", lg: "7" }}
        mt="1rem"
      >
        {Object.values(modelData).map((model) => (
          <RadioCards.Item key={model.name} value={model.name}>
            <Flex direction="column" width="100%">
              <Text weight="bold">{model.name}</Text>
              <Flex mt="4px" gap=".2rem" wrap="wrap">
                <Badge>{model.size}</Badge>
                {model.isQuantized && <Badge color="plum">Quantized</Badge>}
                {model.name.includes(".en") && <Badge>English</Badge>}
                {installedModels?.includes(model.fileName) && (
                  <Badge color="green">Installed</Badge>
                )}
              </Flex>
            </Flex>
          </RadioCards.Item>
        ))}
      </RadioCards.Root>

      <Heading mt="2rem">Whisper configuration</Heading>

      <SettingsTextField
        {...form.register("whisper.threads")}
        label="Thread count"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.processors")}
        label="Processor count"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.maxContext")}
        label="Maximum context"
        description="Maximum number of text context tokens to store."
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.maxLen")}
        label="Maximum Segment length"
        description="Maximum segment length in characters."
        type="number"
      />

      <SettingsSwitchField
        form={form}
        field="whisper.splitOnWord"
        label="Split on Word"
        description="Split on word rather than on token"
      />

      <SettingsTextField
        {...form.register("whisper.bestOf")}
        label="Best of"
        description="Number of best candidates to keep"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.beamSize")}
        label="Beam Size"
        description="Beam size for beam search"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.audioCtx")}
        label="Audio Context"
        description="Audio context size"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.wordThold")}
        label="Word threshold"
        description="Word timestamp probability threshold"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.entropyThold")}
        label="Entropy threshold"
        description="Entropy threshold for decoder fail"
        type="number"
      />

      <SettingsTextField
        {...form.register("whisper.logprobThold")}
        label="Logprob threshold"
        description="Log probability threshold for decoder fail"
        type="number"
      />

      <SettingsSwitchField
        form={form}
        field="whisper.translate"
        label="Translate"
        description="Translate transcription from source language to english"
      />
      <SettingsSwitchField
        form={form}
        field="whisper.diarize"
        label="Diarize"
        description="Diarize speakers based on input device, i.e. microphone and screen audio will be split into two speakers in transcript"
      />
      <SettingsSwitchField
        form={form}
        field="whisper.noFallback"
        label="No Fallback"
        description="Do not use temperature fallback while decoding"
      />

      <SettingsTextField
        {...form.register("whisper.language")}
        label="Language"
        description={`Spoken language, "auto" for auto-detection, "en" for english.`}
      />
    </Tabs.Content>
  );
};
