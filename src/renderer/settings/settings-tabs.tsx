import { FC } from "react";
import { Button, Flex } from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import * as styles from "./styles.module.css";

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
);
