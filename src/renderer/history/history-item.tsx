import { FC, useState } from "react";
import {
  Badge,
  Box,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
} from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiMiniPhone,
} from "react-icons/hi2";
import { RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { Editable } from "../common/editable";
import { EntityTitle } from "../common/entity-title";

export const HistoryItem: FC<{ recording: RecordingMeta; id: string }> = ({
  recording,
  id,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <Box pb=".5rem">
      <Card className="hoverhide-container">
        <Flex align="center" maxWidth="100%" overflow="hidden">
          <Box flexGrow="1" maxWidth="100%" overflow="hidden">
            <Editable
              value={recording.name || "Untitled"}
              onChange={(name) => historyApi.updateRecordingMeta(id, { name })}
              renderValue={({ value, editBtn }) => (
                <EntityTitle
                  subtitle={new Date(recording.started).toLocaleString()}
                  icon={
                    <>
                      {editBtn}
                      <span className="hoverhide-inverseitem">
                        <HiMiniPhone />
                      </span>
                    </>
                  }
                  tags={
                    <span>
                      {!recording.isPostProcessed && (
                        <Badge color="orange">Unprocessed</Badge>
                      )}
                    </span>
                  }
                >
                  {value}
                </EntityTitle>
              )}
            />
          </Box>
          <Flex className={dropdownOpen ? "" : "hoverhide-item"} gap="8px">
            <DropdownMenu.Root onOpenChange={setDropdownOpen}>
              <DropdownMenu.Trigger>
                <IconButton variant="outline">
                  <HiMiniBars3 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={async () => {
                    await historyApi.addToPostProcessingQueue(id);
                    await historyApi.startPostProcessing();
                  }}
                >
                  Postprocess
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <IconButton
              onClick={() => historyApi.openRecordingDetailsWindow(id)}
            >
              <HiArrowTopRightOnSquare />
            </IconButton>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};
