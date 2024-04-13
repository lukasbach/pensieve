import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Flex } from "@radix-ui/themes";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageContainer } from "../common/page-container";
import { Transscript } from "./transcript/transscript";
import { useManagedAudio } from "./use-managed-audio";
import { AudioControls } from "./audio-controls";

export const DetailsScreen: FC = () => {
  const { id } = historyDetailsRoute.useParams();
  const { data: recording } = useQuery({
    queryKey: [QueryKeys.History, id],
    queryFn: () => historyApi.getRecordingMeta(id),
  });
  const { data: transcript } = useQuery({
    queryKey: [QueryKeys.Transcript, id],
    queryFn: () => historyApi.getRecordingTranscript(id),
  });

  const audio = useManagedAudio();

  if (!recording) return null;

  return (
    <PageContainer title={recording?.name ?? "Untitled Recording"}>
      <Flex direction="column" maxHeight="100%">
        <Box flexGrow="1" overflowY="auto">
          {transcript && (
            <Transscript
              meta={recording}
              updateMeta={(update) =>
                historyApi.updateRecordingMeta(id, update)
              }
              // isPlaying={audio.audioTag.current?.paused === false}
              transcript={transcript}
              audio={audio}
            />
          )}
        </Box>
        <Box>
          <AudioControls audio={audio} id={id} />
        </Box>
      </Flex>
    </PageContainer>
  );
};
