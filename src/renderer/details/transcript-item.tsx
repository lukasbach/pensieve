import { Fragment, memo } from "react";
import { Avatar, Box, Flex, IconButton, Text } from "@radix-ui/themes";
import {
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineUserCircle,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { RecordingTranscript } from "../../types";
import { useManagedAudio } from "./use-managed-audio";

export const TranscriptItem = memo<{
  item: RecordingTranscript["transcription"][number];
  priorSpeaker?: string;
  audio: ReturnType<typeof useManagedAudio>;
}>(({ item, priorSpeaker, audio }) => {
  const speaker =
    item.speaker === "0" ? "They" : item.speaker === "1" ? "Me" : "?";
  const text = item.text.trim();
  const time = new Date();
  time.setMilliseconds(item.offsets.from);
  const isHighlighted =
    audio.progress !== 0 &&
    audio.progress * 1000 >= item.offsets.from &&
    audio.progress * 1000 < item.offsets.to;

  return (
    <Fragment key={item.timestamps.from}>
      {(item.speaker !== priorSpeaker || text.startsWith("- ")) && (
        <Flex align="center">
          {/* eslint-disable-next-line no-nested-ternary */}
          {speaker === "Me" ? (
            <Avatar fallback={<HiOutlineUserCircle />} size="2" />
          ) : speaker === "They" ? (
            <Avatar fallback={<HiOutlineUserGroup />} size="2" />
          ) : (
            <Avatar fallback={speaker[0]} size="2" />
          )}
          <Text weight="bold" ml=".5rem" style={{ flexGrow: 1 }}>
            {speaker}
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
      <Box
        pl="calc(32px + 0.5rem)"
        mt=".2rem"
        mb="1rem"
        position="relative"
        className="hoverhide-container"
      >
        <Flex
          position="absolute"
          top="0"
          left="0"
          width="32px"
          justify="end"
          className="hoverhide-item"
        >
          <IconButton
            variant="outline"
            size="1"
            onClick={() => {
              if (audio.isPlaying && isHighlighted) {
                audio.pause();
              } else {
                audio.jump(item.offsets.from / 1000);
                audio.play();
              }
            }}
          >
            {audio.isPlaying && isHighlighted ? (
              <HiOutlinePause />
            ) : (
              <HiOutlinePlay />
            )}
          </IconButton>
        </Flex>
        <Text color={isHighlighted ? "blue" : undefined}>
          {text.startsWith("- ") ? text.slice(2) : text}
        </Text>
      </Box>
    </Fragment>
  );
});
