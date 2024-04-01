export type RecordingData = {
  mic?: ArrayBuffer;
  screen?: ArrayBuffer;
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
