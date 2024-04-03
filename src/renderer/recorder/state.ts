import { create } from "zustand";
import { useCallback } from "react";
import { historyApi } from "../api";
import { blobToBuffer } from "../../utils";
import { RecordingConfig, RecordingMeta } from "../../types";
import { createRecorder } from "./create-recorder";

type RecorderState = {
  recorder?: { screen: MediaRecorder | null; mic: MediaRecorder | null };
  meta: RecordingMeta;
  recordingConfig: RecordingConfig;

  setMeta: (meta: Partial<RecordingMeta>) => void;
  setConfig: (config: Partial<RecordingConfig>) => void;
  startRecording: () => Promise<void>;
  reset: () => void;
};

export const useRecorderState = create<RecorderState>()((set, get) => ({
  recordingConfig: {},
  meta: { started: new Date().toISOString() },

  setMeta: (meta: Partial<RecordingMeta>) =>
    set({ meta: { ...get().meta, ...meta } }),
  setConfig: (config) =>
    set({ recordingConfig: { ...get().recordingConfig, ...config } }),
  startRecording: async () => {
    set({
      recorder: await createRecorder(get().recordingConfig),
      meta: { ...get().meta, started: new Date().toISOString() },
    });
  },
  reset: () => set({ recorder: undefined, meta: undefined }),
}));

const unpackMediaRecorder = async (
  recorder: MediaRecorder | null,
  type = "audio/webm",
) => {
  if (!recorder) return Promise.resolve(null);
  return new Promise<Buffer>((r) => {
    recorder.stop();
    // eslint-disable-next-line no-param-reassign
    recorder.ondataavailable = async (e) => {
      const blob = new Blob([e.data], { type });
      r(await blobToBuffer(blob));
    };
  });
};

export const useStopRecording = () => {
  const { recorder, meta, reset } = useRecorderState();
  return useCallback(async () => {
    if (!recorder || !meta) return;

    reset();
    await historyApi.saveRecording({
      mic: await unpackMediaRecorder(recorder.mic),
      screen: await unpackMediaRecorder(recorder.screen),
      meta,
    });
  }, [meta, recorder, reset]);
};
