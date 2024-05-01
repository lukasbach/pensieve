import {
  Box,
  Button,
  CheckboxCards,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";

import { forwardRef, useEffect } from "react";
import { useRecorderState } from "./state";
import { MicSelector } from "./mic-selector";
import { useMicSources } from "./hooks";
import { RecorderInsession } from "./recorder-insession";

export const Recorder = forwardRef<HTMLDivElement>((_, ref) => {
  const defaultMic = useMicSources()?.[0];

  const {
    setConfig,
    recordingConfig,
    startRecording,
    recorder,
    meta,
    setMeta,
    reset,
  } = useRecorderState();

  useEffect(() => {
    reset();
  }, []);

  if (recorder) {
    return <RecorderInsession ref={ref} />;
  }

  return (
    <Flex direction="column" px=".5rem" py="1rem" gap=".5rem" ref={ref}>
      <TextField.Root
        size="2"
        placeholder="Untitled Recording"
        value={meta?.name ?? ""}
        onChange={(e) => {
          setMeta({ name: e.currentTarget.value });
        }}
      />

      <CheckboxCards.Root
        value={[
          recordingConfig.mic ? "mic" : "",
          recordingConfig.recordScreenAudio ? "screen" : "",
        ]}
        columns={{ initial: "1" }}
        onValueChange={(value) => {
          if (value.filter((v) => !!v).length === 0) return;

          setConfig({
            mic: value.includes("mic")
              ? recordingConfig.mic ?? defaultMic
              : undefined,
            recordScreenAudio: value.includes("screen"),
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
        <Flex maxWidth="100%" gap="1rem">
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
