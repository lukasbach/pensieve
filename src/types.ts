import { app } from "electron";
import path from "path";
import { datahookMarkdownTemplate } from "./datahooks-defaults";

export type RecordingConfig = {
  recordScreenAudio?: boolean;
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
  isPinned?: boolean;
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

export type VectorSearchResult = {
  recordingId: string;
  chunkIndex: number;
  text: string;
  timestamp: string;
  speaker: string;
  score: number;
  startTime: number;
  endTime: number;
};

export type PostProcessingStep =
  | "modelDownload"
  | "wav"
  | "mp3"
  | "whisper"
  | "summary"
  | "datahooks"
  | "vectorSearch";

export type PostProcessingJob = {
  recordingId: string;
  steps?: PostProcessingStep[];
  error?: string;
  isDone?: boolean;
  isRunning?: boolean;
};

export const defaultSettings = {
  core: { recordingsFolder: path.join(app.getPath("userData"), "recordings") },
  ui: {
    dark: true,
    autoStart: true,
    trayRunningNotificationShown: false,
    useOverlayTool: true,
  },
  llm: {
    enabled: true,
    prompt: "",
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
          model: "gemma3:4b",
        },
        embeddings: {
          model: "nomic-embed-text",
          maxConcurrency: 5,
        },
      },
      openai: {
        useCustomUrl: false,
        chatModel: {
          apiKey: "YOUR_API_KEY",
          model: "gpt-3.5-turbo",
          configuration: {
            baseURL: undefined,
          },
        },
        embeddings: {
          model: "text-embedding-3-large",
          dimensions: 1536,
          batchSize: 20,
        },
      },
    },
  },
  ffmpeg: {
    removeRawRecordings: true,
    autoTriggerPostProcess: true,

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
  datahooks: {
    enabled: false,
    features: {
      exportMarkdown: true,
      exportJson: false,
      exportMp3: true,
      exportAssets: true,
      callCmdlet: false,
    },
    markdownTemplate: datahookMarkdownTemplate,
    markdownPath:
      "{{homedir}}\\Desktop\\Pensieve Recordings\\\\{{keydate date}} - {{pathsafe name}}.md",
    jsonPath:
      "{{homedir}}\\Desktop\\Pensieve Recordings\\\\{{keydate date}}.json",
    mp3Path:
      "{{homedir}}\\Desktop\\Pensieve Recordings\\\\{{keydate date}} - {{pathsafe name}}.mp3",
    assetPath:
      "{{homedir}}\\Desktop\\Pensieve Recordings\\assets\\\\{{keydate date}}_{{timestamp}}{{ext}}",
    callCmdlet: 'echo "Recording stored to {{date}}."',
  },
};

export type Settings = typeof defaultSettings;

export type ScreenshotArea = {
  displayId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RecordingIpcState = {
  meta: RecordingMeta | undefined;
  isRecording: boolean;
  isPaused: boolean;
};

export type RecordingIpcEvents = {
  addTimestampedNote: () => void;
  addHighlight: () => void;
  addScreenshot: () => void;
  setMeta: (meta: Partial<RecordingMeta>) => void;
  abort: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};
