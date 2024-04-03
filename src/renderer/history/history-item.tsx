import { FC, useMemo, useState } from "react";
import { Badge, DropdownMenu, IconButton } from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiMiniPhone,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineTrash,
} from "react-icons/hi2";
import { RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { ListItem } from "../common/list-item";
import { EntityTitle } from "../common/entity-title";
import { useConfirm } from "../dialog/context";

export const HistoryItem: FC<{
  recording: RecordingMeta;
  id: string;
  priorItemDate: string;
}> = ({ recording, id, priorItemDate }) => {
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

  return (
    <>
      {isNewDate && (
        <EntityTitle mb=".5rem" mt="1rem">
          {new Date(recording.started).toDateString()}
        </EntityTitle>
      )}
      <ListItem
        title={recording.name || "Untitled"}
        subtitle={new Date(recording.started).toLocaleString()}
        onRename={(name) => historyApi.updateRecordingMeta(id, { name })}
        tags={
          !recording.isPostProcessed && (
            <Badge color="orange">Unprocessed</Badge>
          )
        }
        icon={<HiMiniPhone />}
        forceHoverState={dropdownOpen}
      >
        <DropdownMenu.Root onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger>
            <IconButton variant="outline">
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
                await historyApi.addToPostProcessingQueue(id);
                await historyApi.startPostProcessing();
              }}
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
        <IconButton onClick={() => historyApi.openRecordingDetailsWindow(id)}>
          <HiArrowTopRightOnSquare />
        </IconButton>
      </ListItem>
    </>
  );
};
