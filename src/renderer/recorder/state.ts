import { create } from "zustand";
import { DesktopCapturerSource } from "electron";
import { useCallback, useEffect } from "react";
import { historyApi, mainApi } from "../api";
import { blobToBuffer } from "../../utils";
import { RecordingMeta } from "../../types";

type RecorderState = {
  sources?: DesktopCapturerSource[];
  selectedSource?: DesktopCapturerSource;
  recorder?: { screen: MediaRecorder; mic: MediaRecorder };
  meta?: RecordingMeta;

  setSelectedSource: (source: DesktopCapturerSource) => void;
  startRecording: () => Promise<void>;
  reset: () => void;
};

export const useRecorderState = create<RecorderState>()((set, get) => ({
  setSelectedSource: (source) => set({ selectedSource: source }),
  startRecording: async () => {
    const sourceId = get().selectedSource?.id;

    if (!sourceId) return;

    const displayMedia = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 2,
        },
      },
      video: {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1280,
          minHeight: 720,
          maxHeight: 720,
          maxFrameRate: 1,
        },
      },
    });
    displayMedia.getVideoTracks().forEach((t) => displayMedia.removeTrack(t));
    const screen = new MediaRecorder(displayMedia, {
      mimeType: "audio/webm",
    });
    const mic = new MediaRecorder(
      await navigator.mediaDevices.getUserMedia({ audio: true }),
      {
        mimeType: "audio/webm",
      },
    );
    screen.start();
    mic.start();
    set({
      recorder: { screen, mic },
      meta: { started: new Date().toISOString() },
    });
  },
  reset: () => set({ recorder: undefined, meta: undefined }),
}));

export const useLoadSources = () => {
  useEffect(() => {
    mainApi.getSources().then((sources) => {
      useRecorderState.setState({ sources, selectedSource: sources[0] });
    });
  }, []);
};

export const useStopRecording = () => {
  const { recorder, meta } = useRecorderState();
  return useCallback(async () => {
    if (!recorder || !meta) return;

    const mic = new Promise<Blob>((r) => {
      recorder.mic.stop();
      recorder.mic.ondataavailable = (e) => {
        const blob = new Blob([e.data], { type: "audio/webm" });
        r(blob);
      };
    });
    const screen = new Promise<Blob>((r) => {
      recorder.screen.stop();
      recorder.screen.ondataavailable = (e) => {
        const blob = new Blob([e.data], { type: "audio/webm" });
        r(blob);
      };
    });
    await historyApi.saveRecording({
      mic: await blobToBuffer(await mic),
      screen: await blobToBuffer(await screen),
      meta,
    });
  }, [meta, recorder]);
};
