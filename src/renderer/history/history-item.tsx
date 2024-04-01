import { FC } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import { RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { Editable } from "../common/editable";

export const HistoryItem: FC<{ recording: RecordingMeta; id: string }> = ({
  recording,
  id,
}) => {
  return (
    <Box pb=".5rem">
      <Card className="hoverhide-container">
        <Flex align="center">
          <Box flexGrow="1">
            <Text as="div">
              <Editable
                value={recording.name || "Untitled"}
                onChange={(name) =>
                  historyApi.updateRecordingMeta(id, { name })
                }
                renderValue={({ value, editBtn }) => (
                  <Flex align="center">
                    <Text mr=".5rem">{value}</Text>
                    {editBtn}
                    <Box className="hoverhide-inverseitem">
                      {!recording.isPostProcessed && (
                        <Badge color="orange">Unprocessed</Badge>
                      )}
                    </Box>
                  </Flex>
                )}
              />
            </Text>
            <Text as="p">{new Date(recording.started).toLocaleString()}</Text>
          </Box>
          <Flex className="hoverhide-item" gap="8px">
            {!recording.isPostProcessed && (
              <Button
                onClick={() =>
                  historyApi
                    .postProcessRecording(id)
                    .then(() => console.log("DONE"))
                }
              >
                Post Process
              </Button>
            )}
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
