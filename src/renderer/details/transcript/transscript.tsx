import { FC } from "react";
import { Box } from "@radix-ui/themes";

import { RecordingMeta, RecordingTranscript } from "../../../types";
import { useManagedAudio } from "../use-managed-audio";
import { TranscriptItem } from "./transcript-item";

export const Transscript: FC<{
  transcript: RecordingTranscript;
  audio: ReturnType<typeof useManagedAudio>;
  meta: RecordingMeta;
  updateMeta: (update: Partial<RecordingMeta>) => Promise<void>;
  recordingId: string;
}> = ({ transcript, audio, meta, updateMeta, recordingId }) => {
  return (
    <Box px="2rem" py="1rem">
      {transcript.transcription.map((item, index) => (
        <TranscriptItem
          key={item.offsets.from}
          meta={meta}
          updateMeta={updateMeta}
          item={item}
          audio={audio}
          priorItem={transcript.transcription[index - 1]}
          nextItem={transcript.transcription[index + 1]}
          recordingId={recordingId}
        />
      ))}
    </Box>
  );
};
