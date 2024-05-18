import { useInsessionControls } from "./use-insession-controls";
import { useRecorderIpcEvent } from "./use-recorder-ipc-event";

export const useHostRecorderIpc = () => {
  const controls = useInsessionControls();

  useRecorderIpcEvent("addTimestampedNote", controls.onAddTimestampedNote);
  useRecorderIpcEvent("addHighlight", controls.addHighlight);
  useRecorderIpcEvent("addScreenshot", controls.makeScreenshot);
  useRecorderIpcEvent("setMeta", controls.setMeta);
  useRecorderIpcEvent("abort", controls.onAbort);
  useRecorderIpcEvent("pause", controls.pause);
  useRecorderIpcEvent("resume", controls.resume);
  useRecorderIpcEvent("stop", controls.stopRecording);
};
