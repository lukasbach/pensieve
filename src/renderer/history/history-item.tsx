import { FC } from "react";
import { Badge, Box, Button, Card, Flex, Text } from "@radix-ui/themes";
import { RecordingMeta } from "../../types";
import { mainApi } from "../api";
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
                onChange={(name) => mainApi.updateRecordingMeta(id, { name })}
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
          <Box className="hoverhide-item">
            {!recording.isPostProcessed && (
              <Button
                onClick={() =>
                  mainApi
                    .postProcessRecording(id)
                    .then(() => console.log("DONE"))
                }
              >
                Post Process
              </Button>
            )}
          </Box>
        </Flex>
      </Card>
    </Box>
  );
};
