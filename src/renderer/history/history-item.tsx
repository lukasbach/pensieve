import { FC, useMemo, useState } from "react";
import { Badge, DropdownMenu, IconButton, Tooltip } from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineTrash,
} from "react-icons/hi2";
import humanizer from "humanize-duration";
import { RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { ListItem } from "../common/list-item";
import { EntityTitle } from "../common/entity-title";
import { useConfirm } from "../dialog/context";
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
}> = ({ recording, searchText, id, priorItemDate, isProcessing }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const confirmDeletion = useConfirm(
    "Delete recording",
    "Are you sure you want to delete this recording?",
  );
  const isNewDate = useMemo(() => {
    if (!priorItemDate) return true;
    return (
      new Date(priorItemDate).toDateString() !==
      new Date(recording.started).toDateString()
    );
  }, [priorItemDate, recording.started]);

  const duration = humanizer(recording.duration || 0, { maxDecimalPoints: 0 });

  return (
    <>
      {isNewDate && (
        <EntityTitle mb=".5rem" mt="1rem">
          {new Date(recording.started).toDateString()}
        </EntityTitle>
      )}
      <ListItem
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
        <DropdownMenu.Root onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger>
            <IconButton variant="outline" color="gray">
              <HiMiniBars3 />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              onClick={() => historyApi.openRecordingDetailsWindow(id)}
            >
              <HiArrowTopRightOnSquare /> Open Recording
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={async () => historyApi.openRecordingFolder(id)}
            >
              <HiOutlineFolderOpen /> Open Folder
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={async () => {
                await historyApi.addToPostProcessingQueue({ recordingId: id });
                await historyApi.startPostProcessing();
              }}
              disabled={!recording.hasRawRecording || isProcessing}
            >
              <HiOutlineDocumentText /> Postprocess
            </DropdownMenu.Item>
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
