import { FC, useCallback, useState } from "react";
import {
  Badge,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiMiniPencilSquare,
  HiOutlineCog8Tooth,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineServerStack,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineTrash,
  HiSparkles,
  HiStar,
} from "react-icons/hi2";
import humanizer from "humanize-duration";
import { RiRobot2Line } from "react-icons/ri";
import { LuMouse } from "react-icons/lu";
import {
  HistoryItemDetailsMode,
  PostProcessingStep,
  RecordingMeta,
} from "../../types";
import type { TagDefinition } from "../../tagging";
import { abbreviateTagName, getTagColor } from "../../tagging";
import { historyApi, windowsApi } from "../api";
import { ListItem } from "../common/list-item";
import { EntityTitle } from "../common/entity-title";
import { useWindowedConfirm, useWindowedPromptText } from "../dialog/context";
import { HistoryItemIcon } from "./history-item-icon";
import styles from "./styles.module.css";

const getSummary = (recording: RecordingMeta) => {
  const summary =
    recording.summary?.sentenceSummary ?? recording.summary?.summary;
  return summary?.trim() ? summary.trim() : null;
};

const hasSummary = (recording: RecordingMeta) => {
  return Boolean(
    getSummary(recording) || (recording.summary?.actionItems?.length ?? 0) > 0,
  );
};

const formatFileSize = (fileSizeBytes?: number) => {
  if (typeof fileSizeBytes !== "number" || Number.isNaN(fileSizeBytes)) {
    return null;
  }

  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  const unit = [
    { label: "TB", threshold: 1024 ** 4 },
    { label: "GB", threshold: 1024 ** 3 },
    { label: "MB", threshold: 1024 ** 2 },
    { label: "KB", threshold: 1024 },
  ].find(({ threshold }) => fileSizeBytes >= threshold) ?? {
    label: "KB",
    threshold: 1024,
  };
  const value = fileSizeBytes / unit.threshold;
  const fractionDigits = value >= 10 || Number.isInteger(value) ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${unit.label}`;
};

const getTechnicalDetailsSubtitle = (recording: RecordingMeta) => {
  const detailBadges = [
    !recording.isPostProcessed
      ? { color: "orange" as const, label: "Unprocessed" }
      : null,
    recording.hasEmbedding
      ? { color: "green" as const, label: "Embeddings" }
      : null,
    hasSummary(recording) ? { color: "blue" as const, label: "Summary" } : null,
    recording.hasRawRecording
      ? { color: "gray" as const, label: "Raw recording" }
      : null,
  ].flatMap((badge) => (badge ? [badge] : []));

  return (
    <Flex align="center" gap="2" wrap="nowrap" style={{ overflow: "hidden" }}>
      <Text
        size="1"
        color="gray"
        style={{ flexShrink: 0, whiteSpace: "nowrap" }}
      >
        {formatFileSize(recording.fileSizeBytes) ?? "0 B"}
      </Text>
      {detailBadges.length > 0 && (
        <span className={styles.historySubtitleBadges}>
          {detailBadges.map(({ color, label }) => (
            <Badge key={label} color={color} size="1">
              {label}
            </Badge>
          ))}
        </span>
      )}
    </Flex>
  );
};

const getSubtitle = ({
  detailsMode,
  isProcessing,
  recording,
  searchText,
  duration,
}: {
  detailsMode: HistoryItemDetailsMode;
  isProcessing?: boolean;
  recording: RecordingMeta;
  searchText?: string;
  duration: string;
}) => {
  if (detailsMode === "none") {
    return undefined;
  }

  if (isProcessing) {
    return "Recording is processing...";
  }

  if (searchText) {
    return searchText;
  }

  switch (detailsMode) {
    case "duration":
      return duration;
    case "dateTime":
      return new Date(recording.started).toLocaleString();
    case "technicalDetails":
      return getTechnicalDetailsSubtitle(recording);
    case "summaryOrDuration":
    default:
      return getSummary(recording) ?? duration;
  }
};

export const HistoryItem: FC<{
  availableTags: TagDefinition[];
  recording: RecordingMeta;
  id: string;
  itemDetailsMode: HistoryItemDetailsMode;
  groupLabel?: string;
  searchText?: string;
  isProcessing?: boolean;
  isPinnedItem?: boolean;
}> = ({
  availableTags,
  recording,
  itemDetailsMode,
  searchText,
  id,
  groupLabel,
  isProcessing,
  isPinnedItem,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const compact = itemDetailsMode === "none";
  const actionButtonSize: "1" | "2" = compact ? "1" : "2";
  const confirmDeletion = useWindowedConfirm(
    "Delete recording",
    "Are you sure you want to delete this recording?",
  );
  const promptRename = useWindowedPromptText(
    "Rename recording",
    "What should the name of the recording be?",
    "Untitled Recording",
  );

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

  const editTags = useCallback(async () => {
    const dialogId = `edit-tags-${id}-${Math.random().toString(36).slice(2)}`;
    const nextTags = await windowsApi.openDialog(dialogId, {
      title: "Edit tags",
      input: {
        type: "tags",
        label: "Tags",
      },
      defaultValue: recording.tags ?? [],
    });

    if (Array.isArray(nextTags)) {
      await historyApi.updateRecordingMeta(id, { tags: nextTags });
    }
  }, [id, recording.tags]);

  const duration = humanizer(recording.duration || 0, { maxDecimalPoints: 0 });
  const subtitle = getSubtitle({
    detailsMode: itemDetailsMode,
    duration,
    isProcessing,
    recording,
    searchText,
  });

  return (
    <>
      {groupLabel && !isPinnedItem && (
        <EntityTitle mb=".5rem" mt="1rem">
          {groupLabel}
        </EntityTitle>
      )}
      <ListItem
        id={!isPinnedItem ? id : undefined}
        isHighlighted={recording.isPinned && !isPinnedItem}
        title={recording.name || "Untitled"}
        compact={compact}
        subtitle={subtitle}
        onRename={(name) => historyApi.updateRecordingMeta(id, { name })}
        tags={
          <>
            {!recording.isPostProcessed &&
              itemDetailsMode !== "technicalDetails" && (
                <Badge color="orange">Unprocessed</Badge>
              )}
            {(recording.tags ?? []).length > 0 && (
              <span className={styles.historyTagList}>
                {(recording.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    className={styles.historyTag}
                    color={getTagColor(availableTags, tag)}
                  >
                    {abbreviateTagName(tag, 8)}
                  </Badge>
                ))}
              </span>
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
              size={actionButtonSize}
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
            <IconButton
              size={actionButtonSize}
              aria-label="Open recording actions"
              variant="outline"
              color="gray"
            >
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
            <DropdownMenu.Item onClick={editTags}>
              <HiOutlineTag /> Edit tags
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
                  onClick={() => process(["embedding"])}
                  disabled={!recording.isPostProcessed}
                >
                  <HiSparkles /> Embeddings
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
          <IconButton
            size={actionButtonSize}
            onClick={() => historyApi.openRecordingDetailsWindow(id)}
          >
            <HiArrowTopRightOnSquare />
          </IconButton>
        )}
        {!recording.isPostProcessed &&
          recording.hasRawRecording &&
          !isProcessing && (
            <Tooltip content="Postprocess recording">
              <IconButton
                size={actionButtonSize}
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
