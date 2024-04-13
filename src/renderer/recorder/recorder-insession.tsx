import { forwardRef } from "react";
import { Badge, Button, Flex, TextArea } from "@radix-ui/themes";
import {
  HiMiniPause,
  HiMiniPencilSquare,
  HiMiniPlay,
  HiOutlineStar,
  HiOutlineStopCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import { MdScreenshotMonitor } from "react-icons/md";
import { useMakeScreenshot, useRecorderState, useStopRecording } from "./state";
import { EntityTitle } from "../common/entity-title";
import { RecordingActionButton } from "./recording-action-button";
import { useConfirm, usePromptText } from "../dialog/context";

export const RecorderInsession = forwardRef<HTMLDivElement>((_, ref) => {
  const {
    pause,
    isPaused,
    resume,
    addTimestampedNote,
    addHighlight,
    setMeta,
    reset,
  } = useRecorderState();
  const promptTimestampedNote = usePromptText(
    "Add note at current time",
    "Add note",
    "Note content",
  );
  const confirmAbort = useConfirm(
    "Abort recording",
    "Are you sure you want to abort the current recording?",
  );
  const stopRecording = useStopRecording();
  const makeScreenshot = useMakeScreenshot();

  const onAddTimestampedNote = async () => {
    const content = await promptTimestampedNote();
    if (!content) return;
    addTimestampedNote(content);
  };

  const onAbort = async () => {
    await confirmAbort();
    reset();
  };

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
      {isPaused ? (
        <EntityTitle icon={<Badge color="orange">PAUSED</Badge>}>
          Recording is paused
        </EntityTitle>
      ) : (
        <EntityTitle icon={<Badge color="red">LIVE</Badge>}>
          Recording running
        </EntityTitle>
      )}
      <Flex justify="center" gap=".5rem">
        {isPaused ? (
          <RecordingActionButton tooltip="Resume recording" onClick={resume}>
            <HiMiniPlay size="24" />
          </RecordingActionButton>
        ) : (
          <RecordingActionButton tooltip="Pause recording" onClick={pause}>
            <HiMiniPause size="24" />
          </RecordingActionButton>
        )}
        <RecordingActionButton
          tooltip="Take screenshot"
          onClick={makeScreenshot}
        >
          <MdScreenshotMonitor size="24" />
        </RecordingActionButton>
        <RecordingActionButton
          tooltip="Add note at current time"
          onClick={onAddTimestampedNote}
        >
          <HiMiniPencilSquare size="24" />
        </RecordingActionButton>
        <RecordingActionButton
          tooltip="Highlight the current timestamp in the recording"
          onClick={addHighlight}
        >
          <HiOutlineStar size="24" />
        </RecordingActionButton>
        <RecordingActionButton
          tooltip="Abort the current recording without saving"
          onClick={onAbort}
        >
          <HiOutlineTrash size="24" />
        </RecordingActionButton>
      </Flex>
      <TextArea
        placeholder="Recording notes..."
        style={{ flexGrow: "1" }}
        onChange={(e) => {
          setMeta({ notes: e.currentTarget.value });
        }}
      />
      <Button onClick={stopRecording} size="4">
        <HiOutlineStopCircle /> Stop recording
      </Button>
    </Flex>
  );
});
