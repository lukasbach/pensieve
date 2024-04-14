import { DesktopCapturerSource, app } from "electron";
import path from "path";

export type RecordingConfig = {
  screen?: DesktopCapturerSource;
  mic?: MediaDeviceInfo;
};

export type RecordingData = {
  mic?: ArrayBuffer | null;
  screen?: ArrayBuffer | null;
  meta: RecordingMeta;
};

export type RecordingMeta = {
  started: string;
  duration?: number;
  name?: string;
  isPostProcessed?: boolean;
  isImported?: boolean;
  hasRawRecording?: boolean;
  hasMic?: boolean;
  hasScreen?: boolean;
  language?: string;
  notes?: string;
  timestampedNotes?: Record<number, string>;
  highlights?: number[];
  screenshots?: Record<number, string>;
  summary?: {
    summary?: string | null;
    actionItems?: { isMe: boolean; action: string; time: number }[] | null;
    sentenceSummary?: string | null;
  };
};

export type RecordingTranscript = {
  result: { language: string };
  transcription: RecordingTranscriptItem[];
};

export type RecordingTranscriptItem = {
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
  text: string;
  speaker: string;
};

/* export type Settings = {
  ui: {
    dark: boolean;
  };
  ffmpeg: {
    stereoWavFilter: string;
    mp3Filter: string;
  };
  whisper: {
    model: string;
    threads: number;
    processors: number;
    maxContext: number;
    maxLen: number;
    splitOnWord: boolean;
    bestOf: number;
    beamSize: number;
    translate: boolean;
    audioCtx: number;
    wordThold: number;
    entropyThold: number;
    logprobThold: number;
    diarize: boolean;
    noFallback: boolean;
    language: string;
  };
}; */

export const defaultSettings = {
  core: { recordingsFolder: path.join(app.getPath("userData"), "recordings") },
  ui: {
    dark: true,
    autoStart: true,
    trayRunningNotificationShown: false,
  },
  llm: {
    enabled: true,
    features: {
      summary: true,
      actionItems: true,
      sentenceSummary: true,
    },
    useEmbedding: true,
    provider: "ollama" as "ollama" | "openai",
    providerConfig: {
      ollama: {
        chatModel: {
          baseUrl: "http://localhost:11434",
          model: "llama2:latest",
        },
        embeddings: {
          model: "nomic-embed-text",
          maxConcurrency: 5,
        },
      },
      openai: {
        chatModel: {
          apiKey: "YOUR_API_KEY",
          model: "gpt-3.5-turbo",
        },
        embeddings: {},
      },
    },
  },
  ffmpeg: {
    removeRawRecordings: false,
    autoTriggerPostProcess: false, // TODO

    stereoWavFilter:
      "[0:a][1:a] amerge=inputs=2, pan=stereo|c0<c0+c1|c1<c2+c3, highpass=f=300, lowpass=f=3000 [a]",
    mp3Filter: "amix=inputs=2:duration=longest",
  },
  whisper: {
    model: "ggml-base-q5_1",
    threads: 4,
    processors: 1,
    maxContext: -1,
    maxLen: 0,
    splitOnWord: false,
    bestOf: 5,
    beamSize: 5,
    audioCtx: 0,
    wordThold: 0.01,
    entropyThold: 2.4,
    logprobThold: -1,
    translate: false,
    diarize: true,
    noFallback: false,
    language: "auto",
  },
};

export type Settings = typeof defaultSettings;
