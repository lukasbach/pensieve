import { FC, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  DataList,
  Flex,
  Heading,
  RadioCards,
  Switch,
  Text,
} from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "@react-hookz/web";
import {
  HiOutlineCheckCircle,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { PageContainer } from "../common/page-container";
import * as styles from "./styles.module.css";
import { QueryKeys } from "../../query-keys";
import { mainApi, modelsApi } from "../api";
import { Settings } from "../../types";
import { modelData } from "../../model-data";

export const SettingsScreen: FC = () => {
  const { data: values } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });
  const { data: installedModels } = useQuery({
    queryKey: [QueryKeys.HasModel],
    queryFn: modelsApi.listModels,
  });
  const form = useForm<Settings>({ values, mode: "onChange" });
  const [hasSaved, setHasSaved] = useState(false);

  const handleSubmit = useDebouncedCallback(
    () => {
      console.log("SAVE", form.getValues());
      mainApi.saveSettings(form.getValues());
      setHasSaved((old) => {
        if (!old) {
          setTimeout(() => setHasSaved(false), 1500);
          return true;
        }
        return old;
      });
    },
    [],
    1000,
    10000,
  );

  useEffect(() => handleSubmit, [handleSubmit]);

  return (
    <PageContainer
      title="Settings"
      icon={
        hasSaved ? <HiOutlineCheckCircle /> : <HiOutlineWrenchScrewdriver />
      }
    >
      <Tabs.Root orientation="vertical">
        <Flex height="100%" mt="1rem">
          <Tabs.List>
            <Flex
              direction="column"
              width="240px"
              px="1rem"
              pr="3rem"
              py=".5rem"
              gap=".8rem"
              align="end"
            >
              <Tabs.Trigger value="general" asChild>
                <Button variant="ghost" className={styles.tab}>
                  General Settings
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value="ffmpeg" asChild>
                <Button variant="ghost" className={styles.tab}>
                  Audio Processing
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value="whisper" asChild>
                <Button variant="ghost" className={styles.tab}>
                  Audio Transcription
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value="summary" asChild>
                <Button variant="ghost" className={styles.tab}>
                  Summarization
                </Button>
              </Tabs.Trigger>
              <Tabs.Trigger value="hooks" asChild>
                <Button variant="ghost" className={styles.tab}>
                  Data Hooks
                </Button>
              </Tabs.Trigger>
            </Flex>
          </Tabs.List>
          <Box height="100%" overflowY="auto" flexGrow="1" pr="1rem">
            <form onChange={handleSubmit}>
              <Tabs.Content value="general">
                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label>Dark mode</DataList.Label>
                    <DataList.Label>
                      <Switch
                        defaultChecked={values?.ui.dark}
                        onCheckedChange={(value) =>
                          form.setValue("ui.dark", value)
                        }
                      />
                    </DataList.Label>
                  </DataList.Item>
                </DataList.Root>
              </Tabs.Content>
              <Tabs.Content value="whisper">
                <Heading>Whisper transcription model</Heading>
                <Text>
                  The whisper AI model that is used to transcribe the audio
                  file. If the model is not yet downloaded, it will be
                  downloaded the first time it is used. Larger models have
                  higher CPU and RAM demands.
                </Text>
                {/* <TextField.Root {...form.register("whisper.model")} /> */}

                <RadioCards.Root
                  defaultValue={values?.whisper.model}
                  onValueChange={(v) => form.setValue("whisper.model", v)}
                  columns={{ initial: "1", sm: "4", lg: "7" }}
                >
                  {Object.values(modelData).map((model) => (
                    <RadioCards.Item key={model.name} value={model.name}>
                      <Flex direction="column" width="100%">
                        <Text weight="bold">{model.name}</Text>
                        <Text>
                          {model.size}
                          {installedModels?.includes(model.fileName) && (
                            <Badge>Installed</Badge>
                          )}
                        </Text>
                      </Flex>
                    </RadioCards.Item>
                  ))}
                </RadioCards.Root>
              </Tabs.Content>
            </form>
          </Box>
        </Flex>
      </Tabs.Root>
    </PageContainer>
  );
};
