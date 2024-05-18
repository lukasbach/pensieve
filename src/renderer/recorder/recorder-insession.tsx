import { forwardRef } from "react";
import { Badge, Button, Flex, TextArea } from "@radix-ui/themes";
import {
  HiMiniPause,
  HiMiniPencilSquare,
  HiMiniPlay,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineStopCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import { MdScreenshotMonitor } from "react-icons/md";

import { EntityTitle } from "../common/entity-title";
import { RecordingActionButton } from "./recording-action-button";
import { PageContent } from "../common/page-content";
import { Timer } from "./timer";
import { useInsessionControls } from "./use-insession-controls";
import { useHostRecorderIpc } from "./use-host-recorder-ipc";

export const RecorderInsession = forwardRef<HTMLDivElement>((_, ref) => {
  useHostRecorderIpc();
  const {
    isPaused,
    meta,
    resume,
    pause,
    makeScreenshot,
    onAddTimestampedNote,
    addHighlight,
    setMeta,
    stopRecording,
    onAbort,
  } = useInsessionControls();

  return (
    <PageContent ref={ref}>
      <Flex>
        {isPaused ? (
          <EntityTitle icon={<Badge color="orange">PAUSED</Badge>} flexGrow="1">
            Recording is paused
          </EntityTitle>
        ) : (
          <EntityTitle icon={<Badge color="red">LIVE</Badge>} flexGrow="1">
            Recording running
          </EntityTitle>
        )}
        <Badge style={{ minWidth: "3.5rem" }}>
          <HiOutlineClock />
          <Timer
            start={(Date.now() - new Date(meta?.started ?? 0).getTime()) / 1000}
          />
        </Badge>
      </Flex>

      <Flex justify="center" gap=".5rem" align="center">
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
          signalSuccess
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
          signalSuccess
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
    </PageContent>
  );
});
