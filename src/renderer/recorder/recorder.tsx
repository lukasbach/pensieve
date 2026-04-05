import {
  Box,
  Button,
  Checkbox,
  CheckboxCards,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";

import { forwardRef } from "react";
import { useRecorderState } from "./state";
import { MicSelector } from "./mic-selector";
import { useMicSources } from "./hooks";
import { RecorderInsession } from "./recorder-insession";
import styles from "./recorder.module.css";

const toTimeInputValue = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDefaultAutoEndTime = () => {
  const defaultEnd = new Date();
  defaultEnd.setHours(defaultEnd.getHours() + 1, 0, 0, 0);
  return toTimeInputValue(defaultEnd);
};

export const Recorder = forwardRef<HTMLDivElement>((_, ref) => {
  const defaultMic = useMicSources()?.[0];

  const {
    setConfig,
    recordingConfig,
    startRecording,
    recorder,
    meta,
    setMeta,
  } = useRecorderState();

  // not sure why that was needed?
  // useEffect(() => {
  //   reset();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  if (recorder) {
    return <RecorderInsession ref={ref} />;
  }

  return (
    <Flex direction="column" px=".5rem" py="1rem" gap=".5rem" ref={ref}>
      {/* <button
        onClick={() => {
          windowsApi.openRecorderOverlayWindow();
        }}
      >
        Overlay
      </button> */}
      {/* <DatePicker
        label="Appointment date"
        // minValue={today(getLocalTimeZone())}
      /> */}
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

      <Box mt="1rem" p="3" className={styles.autoEndSection}>
        <Flex direction="column" gap="3">
          <Text as="label" size="2">
            <Flex align="center" gap="2">
              <Checkbox
                checked={!!recordingConfig.autoEndTime}
                onCheckedChange={(checked) => {
                  setConfig({
                    autoEndTime:
                      checked === true
                        ? recordingConfig.autoEndTime ?? getDefaultAutoEndTime()
                        : undefined,
                    askBeforeAutoEnd: recordingConfig.askBeforeAutoEnd ?? true,
                  });
                }}
              />
              <Text weight="bold">End recording at</Text>
            </Flex>
          </Text>

          {recordingConfig.autoEndTime && (
            <>
              <Text as="label" htmlFor="recording-auto-end-time" size="2">
                End time
              </Text>
              <input
                id="recording-auto-end-time"
                aria-label="End time"
                type="time"
                value={recordingConfig.autoEndTime}
                onChange={(e) => {
                  setConfig({ autoEndTime: e.currentTarget.value });
                }}
                className={styles.autoEndTimeInput}
              />
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={recordingConfig.askBeforeAutoEnd !== false}
                    onCheckedChange={(checked) => {
                      setConfig({ askBeforeAutoEnd: checked === true });
                    }}
                  />
                  Ask before ending
                </Flex>
              </Text>
            </>
          )}
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
