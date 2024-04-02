import { FC } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Badge, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { modelData } from "../../model-data";
import { Settings } from "../../types";
import { QueryKeys } from "../../query-keys";
import { modelsApi } from "../api";

export const WhisperSettings: FC = () => {
  const form = useFormContext<Settings>();

  const { data: installedModels } = useQuery({
    queryKey: [QueryKeys.HasModel],
    queryFn: modelsApi.listModels,
  });

  return (
    <Tabs.Content value="whisper">
      <Heading>Whisper transcription model</Heading>
      <Text>
        The whisper AI model that is used to transcribe the audio file. If the
        model is not yet downloaded, it will be downloaded the first time it is
        used. Larger models have higher CPU and RAM demands.
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
    </Tabs.Content>
  );
};
