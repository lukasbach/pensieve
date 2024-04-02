import { FC } from "react";
import { Box } from "@radix-ui/themes";

import { RecordingTranscript } from "../../types";
import { useManagedAudio } from "./use-managed-audio";
import { TranscriptItem } from "./transcript-item";

export const Transscript: FC<{
  transcript: RecordingTranscript;
  audio: ReturnType<typeof useManagedAudio>;
}> = ({ transcript, audio }) => {
  return (
    <Box px="2rem" py="1rem">
      {transcript.transcription.map((item, index) => {
        return (
          <TranscriptItem
            item={item}
            audio={audio}
            priorSpeaker={transcript.transcription[index - 1]?.speaker}
          />
        );
      })}
    </Box>
  );
};
