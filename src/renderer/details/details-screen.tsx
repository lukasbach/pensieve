import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Flex, Tabs } from "@radix-ui/themes";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageContainer } from "../common/page-container";
import { Transscript } from "./transcript/transscript";
import { useManagedAudio } from "./use-managed-audio";
import { AudioControls } from "./audio-controls";
import { Notes } from "./notes";

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
    <Tabs.Root defaultValue="transcript" style={{ height: "100%" }}>
      <PageContainer
        title={recording?.name ?? "Untitled Recording"}
        tabs={
          <Tabs.List style={{ flexGrow: "1" }}>
            <Tabs.Trigger value="transcript">Transcript</Tabs.Trigger>
            <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
          </Tabs.List>
        }
      >
        <Flex direction="column" maxHeight="100%" height="100%">
          <Box flexGrow="1" overflowY="auto">
            <Tabs.Content value="transcript">
              {transcript && (
                <Transscript
                  meta={recording}
                  updateMeta={(update) =>
                    historyApi.updateRecordingMeta(id, update)
                  }
                  transcript={transcript}
                  audio={audio}
                  recordingId={id}
                />
              )}
            </Tabs.Content>
            <Tabs.Content value="notes" asChild>
              <Notes
                meta={recording}
                updateMeta={(update) =>
                  historyApi.updateRecordingMeta(id, update)
                }
              />
            </Tabs.Content>
          </Box>
          <Box>
            <AudioControls audio={audio} id={id} />
          </Box>
        </Flex>
      </PageContainer>
    </Tabs.Root>
  );
};
