import { create } from "zustand";
import { DesktopCapturerSource } from "electron";
import { useCallback, useEffect } from "react";
import { mainApi } from "../api";
import { blobToBuffer } from "../../utils";

type RecorderState = {
  sources?: DesktopCapturerSource[];
  selectedSource?: DesktopCapturerSource;
  recorder?: { screen: MediaRecorder; mic: MediaRecorder };

  setSelectedSource: (source: DesktopCapturerSource) => void;
  startRecording: () => Promise<void>;
  reset: () => void;
};

export const useRecorderState = create<RecorderState>()((set, get) => ({
  setSelectedSource: (source) => set({ selectedSource: source }),
  startRecording: async () => {
    const displayMedia = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: get().selectedSource.id,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 2,
        },
      },
      video: {
        // @ts-ignore
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: get().selectedSource.id,
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
    set({ recorder: { screen, mic } });
  },
  reset: () => set({ recorder: undefined }),
}));

export const useLoadSources = () => {
  useEffect(() => {
    mainApi.getSources().then((sources) => {
      useRecorderState.setState({ sources, selectedSource: sources[0] });
    });
  }, []);
};

export const useStopRecording = () => {
  const { recorder } = useRecorderState();
  return useCallback(async () => {
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
    await mainApi.saveRecording({
      mic: await blobToBuffer(await mic),
      screen: await blobToBuffer(await screen),
    });
  }, [recorder]);
};
