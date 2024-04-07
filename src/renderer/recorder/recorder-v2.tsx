import { FC } from "react";
import {
  Box,
  Button,
  CheckboxCards,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import { HiOutlineStopCircle } from "react-icons/hi2";
import { useMakeScreenshot, useRecorderState, useStopRecording } from "./state";
import { ScreenSelector } from "./screen-selector";
import { MicSelector } from "./mic-selector";
import { useMicSources, useScreenSources } from "./hooks";
import { EmptyState } from "../common/empty-state";

export const RecorderV2: FC = () => {
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
  const stopRecording = useStopRecording();
  const makeScreenshot = useMakeScreenshot();

  if (recorder) {
    return (
      <EmptyState title="Recording running">
        <Button onClick={stopRecording}>
          <HiOutlineStopCircle /> Stop recording
        </Button>
        <Button onClick={makeScreenshot}>Make screenshot</Button>
      </EmptyState>
    );
  }

  return (
    <Flex direction="column" px=".5rem" py="1rem" gap=".5rem">
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
};
