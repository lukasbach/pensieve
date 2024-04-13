import {
  Badge,
  Box,
  Button,
  CheckboxCards,
  Flex,
  IconButton,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import {
  HiMiniPause,
  HiMiniPencilSquare,
  HiOutlineStopCircle,
} from "react-icons/hi2";
import { forwardRef } from "react";
import { MdScreenshotMonitor } from "react-icons/md";
import { useMakeScreenshot, useRecorderState, useStopRecording } from "./state";
import { ScreenSelector } from "./screen-selector";
import { MicSelector } from "./mic-selector";
import { useMicSources, useScreenSources } from "./hooks";
import { EntityTitle } from "../common/entity-title";

export const RecorderV2 = forwardRef<HTMLDivElement>(({}, ref) => {
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

  if (recorder || true) {
    return (
      <Flex
        maxWidth="32rem"
        mx="auto"
        my="1rem"
        px="1rem"
        direction="column"
        gap="1rem"
        flexGrow="1"
        height="-webkit-fill-available"
        ref={ref}
      >
        <EntityTitle icon={<Badge color="red">LIVE</Badge>}>
          Recording running
        </EntityTitle>
        <Flex justify="center" gap=".5rem">
          <Tooltip content="Pause recording">
            <IconButton size="4" variant="soft" color="gray">
              <HiMiniPause size="24" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Take screenshot">
            <IconButton
              onClick={makeScreenshot}
              size="4"
              variant="soft"
              color="gray"
            >
              <MdScreenshotMonitor size="24" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Add note at current time">
            <IconButton variant="soft" color="gray" size="4">
              <HiMiniPencilSquare size="24" />
            </IconButton>
          </Tooltip>
        </Flex>
        <TextArea placeholder="Recording notes..." style={{ flexGrow: "1" }} />
        <Button onClick={stopRecording} size="4">
          <HiOutlineStopCircle /> Stop recording
        </Button>
      </Flex>
    );
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
