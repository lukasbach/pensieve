import type { DesktopCapturerSource } from "electron";

export type RecordingConfig = {
  screen?: DesktopCapturerSource;
  mic?: InputDeviceInfo;
};

export type RecordingData = {
  mic?: ArrayBuffer | null;
  screen?: ArrayBuffer | null;
  meta: RecordingMeta;
};

export type RecordingMeta = {
  started: string;
  name?: string;
  isPostProcessed?: boolean;
};

export type RecordingTranscript = {
  result: { language: string };
  transcription: {
    timestamps: { from: string; to: string };
    offsets: { from: number; to: number };
    text: string;
    speaker: string;
  }[];
};

export type Settings = {
  ui: {
    dark: boolean;
  };
  whisper: {
    model: string;
  };
};
