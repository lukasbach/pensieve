import {
  Box,
  Button,
  Checkbox,
  CheckboxCards,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineComputerDesktop,
  HiOutlineMicrophone,
} from "react-icons/hi2";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { useSettings } from "../common/use-settings";
import { TagInput } from "../common/tag-input";
import { useTags } from "../common/use-tags";
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
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState<boolean>();

  const {
    setConfig,
    recordingConfig,
    startRecording,
    recorder,
    meta,
    setMeta,
  } = useRecorderState();
  const { settings, saveSettings } = useSettings();
  const uiSettings = settings?.ui;
  const updateRecorderTags = useCallback(
    async (nextTags: string[]) => {
      setMeta({ tags: nextTags });
    },
    [setMeta],
  );
  const { availableTags, createTag, setTags } = useTags({
    currentTags: meta?.tags ?? [],
    onChange: updateRecorderTags,
    saveSettings,
    settings,
    syncStoredTags: true,
  });

  useEffect(() => {
    if (uiSettings) {
      setAdvancedSettingsOpen(
        (current) => current ?? uiSettings.recorderAdvancedSettingsOpen,
      );
    }
  }, [uiSettings]);

  const defaultOverlayEnabled = uiSettings?.useOverlayTool ?? true;
  const isAdvancedSettingsOpen = advancedSettingsOpen ?? false;

  const toggleAdvancedSettings = async () => {
    const nextAdvancedSettingsOpen = !isAdvancedSettingsOpen;
    setAdvancedSettingsOpen(nextAdvancedSettingsOpen);
    await saveSettings({
      ui: { recorderAdvancedSettingsOpen: nextAdvancedSettingsOpen },
    });
  };

  const selectedSources = [
    recordingConfig.recordScreenAudio ? "screen" : null,
    recordingConfig.mic ? "mic" : null,
  ].filter((value): value is string => value !== null);

  // not sure why that was needed?
  // useEffect(() => {
  //   reset();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  if (recorder) {
    return <RecorderInsession ref={ref} />;
  }

  return (
    <Flex direction="column" className={styles.root} ref={ref}>
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
        mx="3"
        my="4"
      />

      <Box mx="3" mb="4">
        <TagInput
          ariaLabel="Tags"
          availableTags={availableTags}
          value={meta?.tags ?? []}
          onChange={setTags}
          onCreateTag={createTag}
        />
      </Box>

      <CheckboxCards.Root
        value={selectedSources}
        columns={{ initial: "2" }}
        mx="3"
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
        <CheckboxCards.Item value="screen" className={styles.audioCard}>
          <Flex
            direction="column"
            width="100%"
            className={styles.audioCardContent}
          >
            <Flex align="center" gap="2" className={styles.audioCardTitle}>
              <HiOutlineComputerDesktop className={styles.audioCardTitleIcon} />
              <Text weight="bold" size="3">
                Screen audio
              </Text>
            </Flex>
            <Flex align="start" gap="2" className={styles.audioCardSubtitleRow}>
              <Text size="1" color="gray" className={styles.audioCardSubtitle}>
                Capture audio from the selected display.
              </Text>
            </Flex>
          </Flex>
        </CheckboxCards.Item>
        <CheckboxCards.Item value="mic" className={styles.audioCard}>
          <Flex
            direction="column"
            width="100%"
            className={styles.audioCardContent}
          >
            <Flex align="center" gap="2" className={styles.audioCardTitle}>
              <HiOutlineMicrophone className={styles.audioCardTitleIcon} />
              <Text weight="bold" size="3">
                Microphone
              </Text>
            </Flex>
            <Flex align="start" gap="2" className={styles.audioCardSubtitleRow}>
              <Text size="1" color="gray" className={styles.audioCardSubtitle}>
                Capture your microphone as a separate track.
              </Text>
            </Flex>
          </Flex>
        </CheckboxCards.Item>
      </CheckboxCards.Root>

      <Box mt="4" mx="3">
        <Flex maxWidth="100%" gap="1rem">
          <Box flexBasis="100%" overflow="hidden">
            <Text size="2" weight="bold">
              Microphone
            </Text>
            <MicSelector />
          </Box>
        </Flex>
      </Box>

      {isAdvancedSettingsOpen && (
        <Box
          id="recorder-advanced-settings"
          mt="4"
          mx="3"
          p="3"
          className={styles.advancedSection}
        >
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text weight="bold">Advanced settings</Text>
              <Text size="1" color="gray">
                Adjust automatic stop behavior and overlay controls for this
                recording.
              </Text>
            </Flex>

            <Flex
              direction="column"
              gap="3"
              className={styles.advancedSettingRow}
            >
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={!!recordingConfig.autoEndTime}
                    onCheckedChange={(checked) => {
                      setConfig({
                        autoEndTime:
                          checked === true
                            ? recordingConfig.autoEndTime ??
                              getDefaultAutoEndTime()
                            : undefined,
                        askBeforeAutoEnd:
                          recordingConfig.askBeforeAutoEnd ?? true,
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

            <Flex
              direction="column"
              gap="2"
              className={styles.advancedSettingRow}
            >
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={
                      recordingConfig.enableRecordingOverlay ??
                      defaultOverlayEnabled
                    }
                    onCheckedChange={(checked) => {
                      setConfig({ enableRecordingOverlay: checked === true });
                    }}
                  />
                  <Text weight="bold">Enable recording overlay</Text>
                </Flex>
              </Text>
              <Text size="1" color="gray">
                Show the floating overlay when the main window is closed during
                this recording.
              </Text>
            </Flex>
          </Flex>
        </Box>
      )}

      <Flex mt="4" mx="3" mb="3">
        <Button
          type="button"
          variant="surface"
          color="gray"
          onClick={toggleAdvancedSettings}
          aria-expanded={isAdvancedSettingsOpen}
          aria-controls="recorder-advanced-settings"
        >
          Advanced Settings
          {isAdvancedSettingsOpen ? <HiChevronUp /> : <HiChevronDown />}
        </Button>
      </Flex>

      <Flex className={styles.actionBar} justify="center" px="5" py="5">
        <Button
          onClick={startRecording}
          size="4"
          className={styles.startRecordingButton}
        >
          Start recording
        </Button>
      </Flex>
    </Flex>
  );
});
