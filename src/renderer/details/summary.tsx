import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import Markdown from "react-markdown";
import {
  HiOutlinePlay,
  HiOutlineUserCircle,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { RecordingMeta } from "../../types";
import { useManagedAudio } from "./use-managed-audio";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";
import { EmptyState } from "../common/empty-state";
import { SettingsTab } from "../settings/tabs";
import { PageContent } from "../common/page-content";

export const Summary: FC<{
  audio: ReturnType<typeof useManagedAudio>;
  meta: RecordingMeta;
}> = ({ meta, audio }) => {
  const { data: settings } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });

  if (!meta.summary && !settings?.llm.enabled) {
    return (
      <EmptyState
        title="LLM summarization is not enabled."
        description="You need to set up summarization in the settings and reprocess this recording again to see the summary."
      >
        <Button
          onClick={() => {
            mainApi.openSettingsWindow(SettingsTab.Summary);
          }}
        >
          Go to settings
        </Button>
      </EmptyState>
    );
  }

  if (!meta.summary && settings?.llm.enabled) {
    return (
      <EmptyState
        title="LLM summarization was not executed for this recording."
        description="LLM summarization was not set up when this recording was processed,
          so it was not summarized. You can reprocess this again in the history view."
      />
    );
  }

  return (
    <PageContent maxWidth="800px">
      <Heading>{meta.summary?.sentenceSummary ?? "Meeting summary"}</Heading>
      {meta.summary?.summary && <Markdown>{meta.summary.summary}</Markdown>}

      {meta.summary?.actionItems && (
        <>
          <Heading>Action items</Heading>
          {meta.summary.actionItems.map((item) => (
            <Callout.Root
              key={item.action}
              style={{ display: "block" }}
              variant="outline"
              color={item.isMe ? "blue" : "gray"}
            >
              <Flex width="100%" flexGrow="1" align="center">
                <Box mr="1rem">
                  {item.isMe ? <HiOutlineUserCircle /> : <HiOutlineUserGroup />}
                </Box>
                <Box flexGrow="1">{item.action}</Box>
                <Tooltip content="Jump to">
                  <IconButton
                    size="1"
                    onClick={() => {
                      audio.jump(item.time / 1000 - 1);
                      audio.play();
                    }}
                  >
                    <HiOutlinePlay />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Callout.Root>
          ))}
        </>
      )}
    </PageContent>
  );
};
