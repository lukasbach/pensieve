import * as history from "./history";

const transcriptIndex: Record<string, string> = {};
const titleIndex: Record<string, string> = {};

export const addRecordingToIndex = async (recordingId: string) => {
  const transcript = await history.getRecordingTranscript(recordingId);
  if (!transcript) return;
  const text = transcript.transcription.map((line) => line.text).join(" - ");
  transcriptIndex[recordingId] = text;
};

export const updateRecordingName = (recordingId: string, name?: string) => {
  if (name) {
    titleIndex[recordingId] = name;
  }
};

export const removeRecordingFromIndex = (recordingId: string) => {
  delete transcriptIndex[recordingId];
  delete titleIndex[recordingId];
};

export const initializeSearchIndex = async () => {
  const recordings = await history.listRecordings();
  for (const recordingId of Object.keys(recordings)) {
    await addRecordingToIndex(recordingId);
    const { name } = recordings[recordingId];
    updateRecordingName(recordingId, name);
  }
};

export const search = (query: string) => {
  const nameResults = Object.entries(titleIndex)
    .filter(([, name]) => name.toLowerCase().includes(query.toLowerCase()))
    .map(([id]) => ({ recording: id }));
  const transcriptResults = Object.entries(transcriptIndex)
    .map(
      ([id, text]) =>
        [id, text, text.toLowerCase().indexOf(query.toLowerCase())] as const,
    )
    .filter(([, , index]) => index !== -1)
    .map(([id, text, index]) => ({
      recording: id,
      snippet: `...${text.slice(index - 20, index + 30)}...`,
    }));

  return [...nameResults, ...transcriptResults].reduce(
    (acc, result) => {
      acc[result.recording] = (result as any).snippet ?? true;
      return acc;
    },
    {} as Record<string, string | boolean>,
  );
};
