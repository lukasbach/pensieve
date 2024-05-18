import { useQuery } from "@tanstack/react-query";
import { useInsessionControls } from "./use-insession-controls";
import { QueryKeys } from "../../query-keys";
import { recorderIpcApi } from "../api";
import { RecordingMeta } from "../../types";

export const useIpcInsessionControls: typeof useInsessionControls = () => {
  const recorderIpcState = useQuery({
    queryKey: [QueryKeys.RecorderIpcState],
    queryFn: async () => recorderIpcApi.getState(),
  });

  return {
    // TODO rename to props of RecordingIpcEvents for consistency
    onAddTimestampedNote: () => recorderIpcApi.sendEvent("addTimestampedNote"),
    onAbort: () => recorderIpcApi.sendEvent("abort"),
    isPaused: recorderIpcState.data?.isPaused ?? false,
    pause: () => recorderIpcApi.sendEvent("pause"),
    resume: () => recorderIpcApi.sendEvent("resume"),
    addHighlight: () => recorderIpcApi.sendEvent("addHighlight"),
    setMeta: (meta: Partial<RecordingMeta>) =>
      recorderIpcApi.sendEvent("setMeta", meta),
    meta: recorderIpcState.data?.meta,
    stopRecording: () => recorderIpcApi.sendEvent("stop"),
    makeScreenshot: () => recorderIpcApi.sendEvent("addScreenshot"),
  };
};
