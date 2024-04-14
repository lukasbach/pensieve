import { Fragment, ReactNode, memo, useRef } from "react";
import { Box, Flex, IconButton, Text } from "@radix-ui/themes";
import {
  HiMiniStar,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineStar,
} from "react-icons/hi2";
import { useResizeObserver } from "@react-hookz/web";
import { SpeakerTitle } from "./speaker-title";
import { setScrollPosition } from "./scrolling";

export const TranscriptItemUi = memo<{
  text: string;
  speaker: string;
  isProgressAtItem: boolean;
  isAudioPlaying: boolean;
  isHighlighted: boolean;
  isNewSpeaker: boolean;
  timeText: string;
  time: number;
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
    time,
    onTogglePlaying,
    onToggleHighlight,
    nextItems,
  }) => {
    const boxRef = useRef<HTMLDivElement | null>(null);
    useResizeObserver(boxRef, ({ target }) => {
      const scrollPosition = target.getBoundingClientRect().top;
      setScrollPosition(time, scrollPosition);
    });

    return (
      <>
        {isNewSpeaker && <SpeakerTitle speaker={speaker} timeText={timeText} />}
        <Box
          ref={boxRef}
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
