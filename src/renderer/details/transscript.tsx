import { FC, Fragment } from "react";
import { Avatar, Box, Flex, Text } from "@radix-ui/themes";
import { HiOutlineUserCircle, HiOutlineUserGroup } from "react-icons/hi2";
import { RecordingTranscript } from "../../types";

export const Transscript: FC<{ transcript: RecordingTranscript }> = ({
  transcript,
}) => {
  return (
    <Box px="2rem">
      {transcript.transcription.map((item, index) => {
        const time = new Date();
        time.setMilliseconds(item.offsets.from);
        return (
          <Fragment key={item.timestamps.from}>
            {item.speaker !== transcript.transcription[index - 1]?.speaker && (
              <Flex align="center">
                {/* eslint-disable-next-line no-nested-ternary */}
                {item.speaker === "Me" ? (
                  <Avatar fallback={<HiOutlineUserCircle />} size="2" />
                ) : item.speaker === "They" ? (
                  <Avatar fallback={<HiOutlineUserGroup />} size="2" />
                ) : (
                  <Avatar fallback={item.speaker[0]} size="2" />
                )}
                <Text weight="bold" ml=".5rem" style={{ flexGrow: 1 }}>
                  {item.speaker}
                </Text>
                <Text color="gray">
                  {Math.floor(item.offsets.from / 60000)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {Math.floor((item.offsets.from % 60000) / 1000)
                    .toString()
                    .padStart(2, "0")}
                </Text>
              </Flex>
            )}
            <Box ml="calc(32px + 0.5rem)" mt=".2rem" mb="1rem">
              {item.text}
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
};
