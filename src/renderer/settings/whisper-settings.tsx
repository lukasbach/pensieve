import { FC, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  RadioCards,
  Select,
  Text,
} from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineFolderOpen } from "react-icons/hi2";
import { GoLinkExternal } from "react-icons/go";
import { modelData } from "../../model-data";
import { Settings } from "../../types";
import { QueryKeys } from "../../query-keys";
import { mainApi, modelsApi } from "../api";
import { SettingsTextField } from "./settings-text-field";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTab } from "./tabs";
import { SettingsField } from "./settings-field";

type YesNoAnyFilter = "any" | "yes" | "no";
type ModelTypeFilter =
  | "any"
  | "base"
  | "tiny"
  | "small"
  | "medium"
  | "large";

const yesNoAnyFilterValues: Record<YesNoAnyFilter, string> = {
  any: "Any",
  yes: "Yes",
  no: "No",
};

const modelTypeFilterValues: Record<ModelTypeFilter, string> = {
  any: "Any",
  base: "Base",
  tiny: "Tiny",
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const matchesYesNoAnyFilter = (filter: YesNoAnyFilter, value: boolean) => {
  if (filter === "any") {
    return true;
  }

  return filter === "yes" ? value : !value;
};

const FilterSelect: FC<{
  label: string;
  value: string;
  values: Record<string, string>;
  onValueChange: (value: string) => void;
}> = ({ label, value, values, onValueChange }) => (
  <Flex direction="column" gap="1">
    <Text as="label" size="2" weight="medium">
      {label}
    </Text>
    <Box position="relative">
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger
          style={{
            maxWidth: "-webkit-fill-available",
            minWidth: "-webkit-fill-available",
          }}
        />
        <Select.Content position="popper">
          {Object.entries(values).map(([filterValue, filterLabel]) => (
            <Select.Item key={filterValue} value={filterValue}>
              {filterLabel}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  </Flex>
);

export const WhisperSettings: FC = () => {
  const form = useFormContext<Settings>();
  const [quantizedFilter, setQuantizedFilter] =
    useState<YesNoAnyFilter>("any");
  const [installedFilter, setInstalledFilter] =
    useState<YesNoAnyFilter>("any");
  const [typeFilter, setTypeFilter] = useState<ModelTypeFilter>("any");
  const [englishFilter, setEnglishFilter] = useState<YesNoAnyFilter>("any");

  const { data: installedModels } = useQuery({
    queryKey: [QueryKeys.HasModel],
    queryFn: modelsApi.listModels,
  });

  const filteredModels = Object.values(modelData).filter((model) => {
    const isInstalled = installedModels?.includes(model.fileName) ?? false;
    const isQuantized = model.name.includes("-q");
    const isEnglish = model.name.includes(".en");
    const matchesType = typeFilter === "any" || model.name.includes(typeFilter);

    return (
      matchesYesNoAnyFilter(quantizedFilter, isQuantized) &&
      matchesYesNoAnyFilter(installedFilter, isInstalled) &&
      matchesType &&
      matchesYesNoAnyFilter(englishFilter, isEnglish)
    );
  });

  return (
    <Tabs.Content value={SettingsTab.Whisper}>
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

      <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="3" mt="1rem">
        <FilterSelect
          label="Quantized"
          value={quantizedFilter}
          values={yesNoAnyFilterValues}
          onValueChange={(value) =>
            setQuantizedFilter(value as YesNoAnyFilter)
          }
        />
        <FilterSelect
          label="Installed"
          value={installedFilter}
          values={yesNoAnyFilterValues}
          onValueChange={(value) =>
            setInstalledFilter(value as YesNoAnyFilter)
          }
        />
        <FilterSelect
          label="Type"
          value={typeFilter}
          values={modelTypeFilterValues}
          onValueChange={(value) => setTypeFilter(value as ModelTypeFilter)}
        />
        <FilterSelect
          label="Finetuned for english"
          value={englishFilter}
          values={yesNoAnyFilterValues}
          onValueChange={(value) => setEnglishFilter(value as YesNoAnyFilter)}
        />
      </Grid>

      {filteredModels.length > 0 ? (
        <RadioCards.Root
          defaultValue={form.getValues()?.whisper?.model}
          onValueChange={(v) => form.setValue("whisper.model", v)}
          columns={{ initial: "1", xs: "1", sm: "2", md: "3", lg: "7" }}
          mt="1rem"
        >
          {filteredModels.map((model) => (
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
      ) : (
        <Text as="p" color="gray" mt="1rem">
          No Whisper models match the current filters.
        </Text>
      )}

      <SettingsField
        label="Custom model file"
        description="You can also download one of the models listed above yourself, and place it in your models folder. It will then show up as installed in the list above."
      >
        <Flex gap="0.5rem">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              mainApi.openModelsFolder();
            }}
          >
            <HiOutlineFolderOpen /> Models Folder
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await mainApi.openWeb(
                "https://huggingface.co/ggerganov/whisper.cpp/tree/main",
              );
            }}
          >
            <GoLinkExternal /> huggingface.co/ggerganov/whisper.cpp
          </Button>
        </Flex>
      </SettingsField>

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
