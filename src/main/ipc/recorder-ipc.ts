import * as recorderIpc from "../domain/recorder-ipc";
import { RecordingIpcState } from "../../types";

export const recorderIpcApi = {
  setState: async (newState: Partial<RecordingIpcState>) =>
    recorderIpc.setState(newState),
  getState: async () => recorderIpc.getState(),
  sendEvent: recorderIpc.sendEvent,
};
