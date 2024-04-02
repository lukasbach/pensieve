import { FC, useEffect, useState } from "react";
import { Box, Flex } from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { useDebouncedCallback } from "@react-hookz/web";
import {
  HiOutlineCheckCircle,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { PageContainer } from "../common/page-container";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";
import { Settings } from "../../types";
import { GeneralSettings } from "./general-settings";
import { WhisperSettings } from "./whisper-settings";
import { SettingsTabs } from "./settings-tabs";
import { FfmpegSettings } from "./ffmpeg-settings";
import { SummarySettings } from "./summary-settings";
import { HooksSettings } from "./hooks-settings";

export const SettingsScreen: FC = () => {
  const { data: values } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
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
            <SettingsTabs />
          </Tabs.List>
          <Box height="100%" overflowY="auto" flexGrow="1" pr="1rem">
            <form onChange={handleSubmit}>
              <FormProvider {...form}>
                <GeneralSettings />
                <FfmpegSettings />
                <WhisperSettings />
                <SummarySettings />
                <HooksSettings />
              </FormProvider>
            </form>
          </Box>
        </Flex>
      </Tabs.Root>
    </PageContainer>
  );
};
