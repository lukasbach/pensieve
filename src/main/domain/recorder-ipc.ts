import { RecordingIpcEvents, RecordingIpcState } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as windows from "./windows";

const state: RecordingIpcState = {
  isRecording: false,
  isPaused: false,
  meta: undefined,
};

export const setState = (newState: Partial<RecordingIpcState>) => {
  const nextIsRecording = newState.isRecording ?? state.isRecording;
  const nextEnableRecordingOverlay =
    "enableRecordingOverlay" in newState
      ? newState.enableRecordingOverlay
      : state.enableRecordingOverlay;

  if (!state.isRecording && nextIsRecording && !windows.isMainWindowOpen()) {
    windows.openRecorderOverlayWindow(nextEnableRecordingOverlay);
  }
  if (
    state.isRecording &&
    nextIsRecording === false &&
    windows.isRecorderOverlayOpen()
  ) {
    windows.closeRecorderOverlayWindow();
  }

  if (newState.isRecording !== undefined) {
    state.isRecording = newState.isRecording;
  }
  if (newState.isPaused !== undefined) {
    state.isPaused = newState.isPaused;
  }
  if ("meta" in newState) {
    state.meta = newState.meta;
  }
  if ("enableRecordingOverlay" in newState) {
    state.enableRecordingOverlay = newState.enableRecordingOverlay;
  }

  invalidateUiKeys(QueryKeys.RecorderIpcState);
};

export const getState = () => {
  return state;
};

export const sendEvent = async <T extends keyof RecordingIpcEvents>(
  type: T,
  ...args: Parameters<RecordingIpcEvents[T]>
) => {
  windows.getMainWindow()?.webContents.send("recorderIpcEvent", { type, args });
};
