import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Flex, Tabs } from "@radix-ui/themes";
import { HiMiniPencilSquare, HiOutlineBars3BottomLeft, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageContainer } from "../common/page-container";
import { Transscript } from "./transcript/transscript";
import { useManagedAudio } from "./use-managed-audio";
import { AudioControls } from "./audio-controls";
import { Notes } from "./notes";
import { Summary } from "./summary";
import { RecordingChat } from "./recording-chat";
import { EmptyState } from "../common/empty-state";
import { SearchBar } from "./search-bar";
import { ResponsiveTabTrigger } from "../common/responsive-tab-trigger";

export const DetailsScreen: FC = () => {
  const { id } = historyDetailsRoute.useParams();
  const [tab, setTab] = useState("transcript");
  const { data: recording } = useQuery({
    queryKey: [QueryKeys.History, id],
    queryFn: () => historyApi.getRecordingMeta(id),
  });
  const { data: transcript } = useQuery({
    queryKey: [QueryKeys.Transcript, id],
    queryFn: () => historyApi.getRecordingTranscript(id),
  });

  const audio = useManagedAudio(transcript);

  if (!recording || !transcript) {
    return (
      <PageContainer title={recording?.name ?? "Untitled Recording"}>
        <EmptyState>Loading...</EmptyState>
      </PageContainer>
    );
  }

  return (
    <Tabs.Root value={tab} onValueChange={setTab} style={{ height: "100%" }}>
      <PageContainer
        title={recording?.name ?? "Untitled Recording"}
        statusButtons={
          <SearchBar
            transcript={transcript}
            onJumpTo={(time) => {
              setTab("transcript");
              audio.jump(time / 1000 - 1);
              setTimeout(() => audio.scrollTo(time));
            }}
          />
        }
        tabs={
          <Tabs.List style={{ flexGrow: "1" }}>
            <ResponsiveTabTrigger
              value="transcript"
              icon={<HiOutlineBars3BottomLeft />}
            >
              Transcript
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger value="summary" icon={<RiRobot2Line />}>
              Summary
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger value="notes" icon={<HiMiniPencilSquare />}>
              Notes
            </ResponsiveTabTrigger>
            <ResponsiveTabTrigger value="chat" icon={<HiOutlineChatBubbleLeftRight />}>
              Chat
            </ResponsiveTabTrigger>
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
            <Tabs.Content value="summary">
              <Summary
                meta={recording}
                onJumpTo={(time) => {
                  setTab("transcript");
                  audio.jump(time / 1000 - 1);
                  audio.play();
                  setTimeout(() => audio.scrollTo(time));
                }}
              />
            </Tabs.Content>
            <Tabs.Content value="chat">
              <RecordingChat
                recordingId={id}
                meta={recording}
                onJumpTo={(time) => {
                  setTab("transcript");
                  audio.jump(time / 1000 - 1);
                  audio.play();
                  setTimeout(() => audio.scrollTo(time));
                }}
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
