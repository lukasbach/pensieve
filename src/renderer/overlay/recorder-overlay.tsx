import { FC, useEffect, useRef } from "react";
import { Badge, Box, Flex } from "@radix-ui/themes";
import {
  HiMiniArrowTopRightOnSquare,
  HiMiniPause,
  HiMiniPencilSquare,
  HiMiniPlay,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineStopCircle,
  HiOutlineTrash,
  HiPause,
} from "react-icons/hi2";
import { RiDraggable } from "react-icons/ri";
import { MdScreenshotMonitor } from "react-icons/md";
import { RecordingActionButton } from "../recorder/recording-action-button";
import styles from "./recorder-overlay.module.css";
import { windowsApi } from "../api";
import { Timer } from "../recorder/timer";
import { useIpcInsessionControls } from "../recorder/use-ipc-insession-controls";

export const RecorderOverlay: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useIpcInsessionControls();
  useEffect(() => {
    document.body.style.background = "transparent";
    document.getElementById("root")!.style.background = "transparent";
  }, []);

  return (
    <div>
      <Flex
        ref={containerRef}
        px="2"
        py="2"
        align="center"
        style={{
          borderRadius: "var(--radius-4)",
          background: "var(--color-background)",
          border: "1px solid var(--gray-6)",
        }}
        onMouseEnter={() => {
          windowsApi.mouseEnterRecordingOverlay();
        }}
        onMouseLeave={(e) => {
          if (containerRef.current?.contains(e.relatedTarget as Node)) return;
          windowsApi.mouseLeaveRecordingOverlay();
          // TODO? windowsApi.mouseLeaveRecordingOverlay(e.currentTarget.innerHTML);
        }}
      >
        <Flex gap=".2rem" align="center">
          <RecordingActionButton
            tooltip="Stop recording"
            onClick={controls.stopRecording}
            inOverlay
          >
            <HiOutlineStopCircle size="24" />
          </RecordingActionButton>
          {controls.isPaused ? (
            <RecordingActionButton
              tooltip="Resume recording"
              onClick={controls.resume}
              inOverlay
            >
              <HiMiniPlay size="24" />
            </RecordingActionButton>
          ) : (
            <RecordingActionButton
              tooltip="Pause recording"
              onClick={controls.pause}
              inOverlay
            >
              <HiMiniPause size="24" />
            </RecordingActionButton>
          )}
          <RecordingActionButton
            tooltip="Take screenshot"
            onClick={controls.makeScreenshot}
            signalSuccess
            inOverlay
          >
            <MdScreenshotMonitor size="24" />
          </RecordingActionButton>
          <RecordingActionButton
            tooltip="Add note at current time"
            onClick={controls.onAddTimestampedNote}
            inOverlay
          >
            <HiMiniPencilSquare size="24" />
          </RecordingActionButton>
          <RecordingActionButton
            tooltip="Highlight the current timestamp in the recording"
            onClick={controls.addHighlight}
            signalSuccess
            inOverlay
          >
            <HiOutlineStar size="24" />
          </RecordingActionButton>
          <RecordingActionButton
            tooltip="Open the main window"
            onClick={windowsApi.openMainWindowNormally}
            inOverlay
          >
            <HiMiniArrowTopRightOnSquare size="24" />
          </RecordingActionButton>
          <RecordingActionButton
            tooltip="Abort the current recording without saving"
            onClick={controls.onAbort}
            inOverlay
          >
            <HiOutlineTrash size="24" />
          </RecordingActionButton>
          <Badge
            size="2"
            style={{ minWidth: "4rem" }}
            mr="2"
            color={controls.isPaused ? "red" : undefined}
          >
            {controls.isPaused ? <HiPause /> : <HiOutlineClock />}
            {controls.isPaused ? (
              "PAUSED"
            ) : (
              <Timer
                start={
                  controls.meta &&
                  (Date.now() -
                    new Date(controls.meta?.started ?? 0).getTime()) /
                    1000
                }
              />
            )}
          </Badge>
        </Flex>
        <Box flexGrow="1" />
        <Flex className={styles.draggable} py="2">
          <RiDraggable />
        </Flex>
      </Flex>
    </div>
  );
};
