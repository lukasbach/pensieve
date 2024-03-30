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
