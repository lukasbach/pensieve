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
  isPaused: boolean;
  isRecording: boolean;

  getCurrentTime: () => number;
  setMeta: (meta: Partial<RecordingMeta>) => void;
  setConfig: (config: Partial<RecordingConfig>) => void;
  startRecording: () => Promise<void>;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  addHighlight: () => void;
  addTimestampedNote: (note: string) => void;
  addScreenshot: (fileName: string) => void;
};

export const useRecorderState = create<RecorderState>()((set, get) => ({
  recordingConfig: {},
  meta: { started: new Date().toISOString() },
  isRecording: false,
  isPaused: false,

  getCurrentTime: () =>
    new Date().getTime() - new Date(get().meta.started).getTime(),

  setMeta: (meta: Partial<RecordingMeta>) =>
    set({ meta: { ...get().meta, ...meta } }),
  setConfig: (config) =>
    set({ recordingConfig: { ...get().recordingConfig, ...config } }),
  startRecording: async () => {
    set({
      recorder: await createRecorder(get().recordingConfig),
      meta: { ...get().meta, started: new Date().toISOString() },
      isRecording: true,
      isPaused: false,
    });
  },
  reset: () =>
    set({
      recorder: undefined,
      meta: undefined,
      isRecording: false,
      isPaused: false,
    }),
  pause: () => {
    get().recorder?.mic?.pause();
    get().recorder?.screen?.pause();
    set({ isPaused: true });
  },
  resume: () => {
    get().recorder?.mic?.resume();
    get().recorder?.screen?.resume();
    set({ isPaused: false });
  },
  addHighlight: () => {
    set({
      meta: {
        ...get().meta,
        highlights: [...(get().meta.highlights ?? []), get().getCurrentTime()],
      },
    });
  },
  addTimestampedNote: (note: string) => {
    set({
      meta: {
        ...get().meta,
        timestampedNotes: {
          ...get().meta.timestampedNotes,
          [get().getCurrentTime()]: note,
        },
      },
    });
  },
  addScreenshot: (url: string) => {
    set({
      meta: {
        ...get().meta,
        screenshots: {
          ...get().meta.screenshots,
          [get().getCurrentTime()]: url,
        },
      },
    });
  },
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

export const useMakeScreenshot = () => {
  const { recorder, addScreenshot } = useRecorderState();
  return useCallback(async () => {
    if (!recorder?.screen) return;
    const videoStream = recorder.screen.stream.getVideoTracks()[0];
    const imageCapturer = new ImageCapture(videoStream);

    const frame = await imageCapturer.grabFrame();
    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext("bitmaprenderer");
    if (!ctx) throw new Error("no bitmaprenderer");
    ctx.transferFromImageBitmap(frame);
    const blob = await new Promise<Blob | null>((r) => {
      canvas.toBlob(r);
    });
    canvas.remove();
    if (!blob) throw new Error("no blob");

    /* const blob = await imageCapturer.takePhoto({
      imageWidth: videoStream.getSettings().width,
      imageHeight: videoStream.getSettings().height,
    }); */

    const buffer = await blobToBuffer(blob);
    const fileName = `${new Date().getTime()}.png`;
    await historyApi.storeUnassociatedScreenshot(fileName, buffer);
    addScreenshot(fileName);
  }, [addScreenshot, recorder?.screen]);
};
