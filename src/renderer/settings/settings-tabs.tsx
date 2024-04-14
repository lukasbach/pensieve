import { FC } from "react";
import { Button, Flex } from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import * as styles from "./styles.module.css";
import { SettingsTab } from "./tabs";

export const SettingsTabs: FC = () => (
  <Flex
    direction="column"
    width="240px"
    px="1rem"
    pr="3rem"
    py=".5rem"
    gap=".8rem"
    align="end"
    pt="1rem"
  >
    <Tabs.Trigger value={SettingsTab.General} asChild>
      <Button variant="ghost" className={styles.tab}>
        General Settings
      </Button>
    </Tabs.Trigger>
    <Tabs.Trigger value={SettingsTab.Ffmpeg} asChild>
      <Button variant="ghost" className={styles.tab}>
        Audio Processing
      </Button>
    </Tabs.Trigger>
    <Tabs.Trigger value={SettingsTab.Whisper} asChild>
      <Button variant="ghost" className={styles.tab}>
        Audio Transcription
      </Button>
    </Tabs.Trigger>
    <Tabs.Trigger value={SettingsTab.Summary} asChild>
      <Button variant="ghost" className={styles.tab}>
        Summarization
      </Button>
    </Tabs.Trigger>
    <Tabs.Trigger value={SettingsTab.Hooks} asChild>
      <Button variant="ghost" className={styles.tab}>
        Data Hooks
      </Button>
    </Tabs.Trigger>
  </Flex>
);
