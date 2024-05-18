import {
  useMakeRegionScreenshot,
  useRecorderState,
  useStopRecording,
} from "./state";
import { useWindowedConfirm, useWindowedPromptText } from "../dialog/context";
import { RecordingMeta } from "../../types";

export const useInsessionControls = () => {
  const {
    pause,
    isPaused,
    resume,
    addTimestampedNote,
    addHighlight,
    setMeta,
    reset,
    meta,
  } = useRecorderState();
  const promptTimestampedNote = useWindowedPromptText(
    "Add note at current time",
    "Add note",
    "Note content",
  );
  const confirmAbort = useWindowedConfirm(
    "Abort recording",
    "Are you sure you want to abort the current recording?",
  );
  const stopRecording = useStopRecording();
  const makeScreenshot = useMakeRegionScreenshot();

  const onAddTimestampedNote = async () => {
    const content = await promptTimestampedNote();
    if (!content) return;
    addTimestampedNote(content);
  };

  const onAbort = async () => {
    await confirmAbort();
    reset();
  };

  return {
    // TODO rename to props of RecordingIpcEvents for consistency
    onAddTimestampedNote,
    onAbort,
    isPaused,
    pause,
    resume,
    addHighlight,
    setMeta,
    meta: meta as RecordingMeta | undefined,
    stopRecording,
    makeScreenshot,
  };
};
