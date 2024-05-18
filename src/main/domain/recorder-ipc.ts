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
  if (
    !state.isRecording &&
    newState.isRecording &&
    !windows.isMainWindowOpen()
  ) {
    windows.openRecorderOverlayWindow();
  }
  if (
    state.isRecording &&
    newState.isRecording === false &&
    windows.isRecorderOverlayOpen()
  ) {
    windows.closeRecorderOverlayWindow();
  }

  state.isRecording = newState.isRecording ?? state.isRecording;
  state.isPaused = newState.isPaused ?? state.isPaused;
  state.meta = newState.meta ?? state.meta;
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
