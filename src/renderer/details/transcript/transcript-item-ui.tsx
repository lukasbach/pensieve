import { Fragment, ReactNode, memo } from "react";
import { Box, Flex, IconButton, Text } from "@radix-ui/themes";
import {
  HiMiniStar,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineStar,
} from "react-icons/hi2";
import { SpeakerTitle } from "./speaker-title";

export const TranscriptItemUi = memo<{
  text: string;
  speaker: string;
  isProgressAtItem: boolean;
  isAudioPlaying: boolean;
  isHighlighted: boolean;
  isNewSpeaker: boolean;
  timeText: string;
  onTogglePlaying: () => void;
  onToggleHighlight: () => void;
  nextItems?: ReactNode;
}>(
  ({
    text,
    speaker,
    isProgressAtItem,
    isAudioPlaying,
    isHighlighted,
    isNewSpeaker,
    timeText,
    onTogglePlaying,
    onToggleHighlight,
    nextItems,
  }) => {
    return (
      <>
        {isNewSpeaker && <SpeakerTitle speaker={speaker} timeText={timeText} />}
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
            gap=".2rem"
            justify="end"
          >
            <IconButton
              className="hoverhide-item"
              variant="outline"
              size="1"
              onClick={onTogglePlaying}
            >
              {isAudioPlaying && isProgressAtItem ? (
                <HiOutlinePause />
              ) : (
                <HiOutlinePlay />
              )}
            </IconButton>
            <IconButton
              variant="outline"
              color="yellow"
              size="1"
              onClick={onToggleHighlight}
              className={isHighlighted ? undefined : "hoverhide-item"}
            >
              {isHighlighted ? <HiMiniStar /> : <HiOutlineStar />}
            </IconButton>
          </Flex>
          <Text color={isProgressAtItem ? "blue" : undefined}>
            {text.startsWith("- ") ? text.slice(2) : text}
          </Text>
        </Box>
        {nextItems}
      </>
    );
  },
);
