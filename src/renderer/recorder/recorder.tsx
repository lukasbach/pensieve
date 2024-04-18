import {
  Box,
  Button,
  CheckboxCards,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";

import { forwardRef } from "react";
import { useRecorderState } from "./state";
import { ScreenSelector } from "./screen-selector";
import { MicSelector } from "./mic-selector";
import { useMicSources, useScreenSources } from "./hooks";
import { RecorderInsession } from "./recorder-insession";

export const Recorder = forwardRef<HTMLDivElement>((_, ref) => {
  const defaultMic = useMicSources()?.[0];
  const defaultScreen = useScreenSources()?.[0];

  const {
    setConfig,
    recordingConfig,
    startRecording,
    recorder,
    meta,
    setMeta,
  } = useRecorderState();

  if (recorder) {
    return <RecorderInsession ref={ref} />;
  }

  return (
    <Flex direction="column" px=".5rem" py="1rem" gap=".5rem" ref={ref}>
      <TextField.Root
        size="2"
        placeholder="Untitled Recording"
        value={meta?.name}
        onChange={(e) => {
          setMeta({ name: e.currentTarget.value });
        }}
      />

      <CheckboxCards.Root
        defaultValue={[
          recordingConfig.mic ? "mic" : "",
          recordingConfig.screen ? "screen" : "",
        ]}
        columns={{ initial: "1" }}
        onValueChange={(value) => {
          setConfig({
            mic: value.includes("mic")
              ? recordingConfig.mic ?? defaultMic
              : undefined,
            screen: value.includes("screen")
              ? recordingConfig.screen ?? defaultScreen
              : undefined,
          });
        }}
      >
        <CheckboxCards.Item value="screen">
          <Flex direction="column" width="100%">
            <Text weight="bold">Record screen audio</Text>
          </Flex>
        </CheckboxCards.Item>
        <CheckboxCards.Item value="mic">
          <Flex direction="column" width="100%">
            <Text weight="bold">Record microphone</Text>
          </Flex>
        </CheckboxCards.Item>
      </CheckboxCards.Root>

      <Box mt="1rem">
        <Text weight="bold">Device configuration</Text>
        <Flex maxWidth="100%" gap="1rem">
          <Box flexBasis="100%" overflow="hidden">
            <Text size="2" weight="bold">
              Screen
            </Text>
            <ScreenSelector />
          </Box>
          <Box flexBasis="100%" overflow="hidden">
            <Text size="2" weight="bold">
              Microphone
            </Text>
            <MicSelector />
          </Box>
        </Flex>
      </Box>

      <Flex justify="center">
        <Button
          onClick={startRecording}
          size="3"
          mt="1rem"
          style={{ width: "200px" }}
        >
          Start recording
        </Button>
      </Flex>
    </Flex>
  );
});
