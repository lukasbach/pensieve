import { FC, useCallback, useMemo, useState } from "react";
import { Badge, DropdownMenu, IconButton, Tooltip } from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiMiniPencilSquare,
  HiOutlineCog8Tooth,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineServerStack,
  HiOutlineStar,
  HiOutlineTrash,
  HiStar,
} from "react-icons/hi2";
import humanizer from "humanize-duration";
import { RiRobot2Line } from "react-icons/ri";
import { LuMouse } from "react-icons/lu";
import { PostProcessingStep, RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { ListItem } from "../common/list-item";
import { EntityTitle } from "../common/entity-title";
import { useWindowedConfirm, useWindowedPromptText } from "../dialog/context";
import { HistoryItemIcon } from "./history-item-icon";

const getSubtitle = ({
  summary,
  searchText,
  duration,
}: {
  searchText?: string;
  duration: string;
  summary?: string | null;
}) => {
  if (searchText) return searchText;
  if (summary) return `${summary} - ${duration}`;
  return duration;
};

export const HistoryItem: FC<{
  recording: RecordingMeta;
  id: string;
  priorItemDate: string;
  searchText?: string;
  isProcessing?: boolean;
  isPinnedItem?: boolean;
}> = ({
  recording,
  searchText,
  id,
  priorItemDate,
  isProcessing,
  isPinnedItem,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const confirmDeletion = useWindowedConfirm(
    "Delete recording",
    "Are you sure you want to delete this recording?",
  );
  const promptRename = useWindowedPromptText(
    "Rename recording",
    "What should the name of the recording be?",
    "Untitled Recording",
  );
  const isNewDate = useMemo(() => {
    if (!priorItemDate) return true;
    return (
      new Date(priorItemDate).toDateString() !==
      new Date(recording.started).toDateString()
    );
  }, [priorItemDate, recording.started]);

  const process = useCallback(
    async (steps?: PostProcessingStep[]) => {
      await historyApi.addToPostProcessingQueue({
        recordingId: id,
        steps,
      });
      await historyApi.startPostProcessing();
    },
    [id],
  );

  const rename = useCallback(async () => {
    const name = await promptRename(recording.name);
    if (name) {
      await historyApi.updateRecordingMeta(id, { name });
    }
  }, [id, promptRename, recording.name]);

  const duration = humanizer(recording.duration || 0, { maxDecimalPoints: 0 });

  return (
    <>
      {isNewDate && !isPinnedItem && (
        <EntityTitle mb=".5rem" mt="1rem">
          {new Date(recording.started).toDateString()}
        </EntityTitle>
      )}
      <ListItem
        id={!isPinnedItem ? id : undefined}
        isHighlighted={recording.isPinned && !isPinnedItem}
        title={recording.name || "Untitled"}
        subtitle={
          isProcessing
            ? "Recording is processing..."
            : getSubtitle({
                summary: recording.summary?.sentenceSummary,
                searchText,
                duration,
              })
        }
        onRename={(name) => historyApi.updateRecordingMeta(id, { name })}
        tags={
          <>
            {!recording.isPostProcessed && (
              <Badge color="orange">Unprocessed</Badge>
            )}
            {recording.language && (
              <Badge>{recording.language.toUpperCase()}</Badge>
            )}
          </>
        }
        icon={
          <HistoryItemIcon
            isProcessing={isProcessing ?? false}
            recording={recording}
          />
        }
        forceHoverState={dropdownOpen}
      >
        {isPinnedItem && (
          <Tooltip content="Jump to item">
            <IconButton
              variant="outline"
              color="gray"
              onClick={async () => {
                document.getElementById(id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <LuMouse />
            </IconButton>
          </Tooltip>
        )}
        <DropdownMenu.Root onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger>
            <IconButton variant="outline" color="gray">
              <HiMiniBars3 />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              onClick={() => historyApi.openRecordingDetailsWindow(id)}
              disabled={!recording.isPostProcessed || isProcessing}
            >
              <HiArrowTopRightOnSquare /> Open Recording
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={rename}>
              <HiMiniPencilSquare /> Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() =>
                historyApi.updateRecordingMeta(id, {
                  isPinned: !recording.isPinned,
                })
              }
            >
              {recording.isPinned ? (
                <>
                  <HiStar /> Unpin recording
                </>
              ) : (
                <>
                  <HiOutlineStar /> Pin recording
                </>
              )}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={async () => historyApi.openRecordingFolder(id)}
            >
              <HiOutlineFolderOpen /> Open Folder
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => process()}
              disabled={!recording.hasRawRecording || isProcessing}
            >
              <HiOutlineDocumentText /> Postprocess
            </DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                <HiOutlineCog8Tooth /> Custom postprocessing...
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item
                  onClick={() => process(["mp3", "wav", "whisper"])}
                  disabled={!recording.hasRawRecording}
                >
                  <HiOutlineDocumentText /> Audio and transcription
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => process(["summary"])}
                  disabled={!recording.isPostProcessed}
                >
                  <RiRobot2Line /> Summarization
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => process(["datahooks"])}
                  disabled={!recording.isPostProcessed}
                >
                  <HiOutlineServerStack /> Data hooks
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Item
              color="red"
              onClick={async () => {
                await confirmDeletion();
                await historyApi.removeRecording(id);
              }}
            >
              <HiOutlineTrash /> Delete recording
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {recording.isPostProcessed && (
          <IconButton onClick={() => historyApi.openRecordingDetailsWindow(id)}>
            <HiArrowTopRightOnSquare />
          </IconButton>
        )}
        {!recording.isPostProcessed &&
          recording.hasRawRecording &&
          !isProcessing && (
            <Tooltip content="Postprocess recording">
              <IconButton
                onClick={async () => {
                  await historyApi.addToPostProcessingQueue({
                    recordingId: id,
                  });
                  await historyApi.startPostProcessing();
                }}
              >
                <HiOutlineDocumentText />
              </IconButton>
            </Tooltip>
          )}
      </ListItem>
    </>
  );
};
