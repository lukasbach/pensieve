import { FC, useState } from "react";
import { Box, Flex, IconButton, Slider, Tooltip } from "@radix-ui/themes";
import {
  HiChevronDoubleDown,
  HiOutlineBackward,
  HiOutlineForward,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";
import { LuMouse } from "react-icons/lu";
import { useDebouncedEffect } from "@react-hookz/web";
import { useManagedAudio } from "./use-managed-audio";
import { timeToDisplayString } from "../../utils";

export const AudioControls: FC<{
  audio: ReturnType<typeof useManagedAudio>;
  id: string;
}> = ({ audio, id }) => {
  const [syncScroll, setSyncScroll] = useState(false);

  useDebouncedEffect(
    () => {
      if (syncScroll) {
        audio.scrollTo(audio.progress * 1000);
      }
    },
    [audio.progress],
    1000,
    2000,
  );

  return (
    <Box px="1rem" py=".5rem" style={{ borderTop: `1px solid var(--gray-5)` }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio preload="auto" ref={audio.audioTag}>
        <source src={`http://localhost:3001/audio/${id}`} type="audio/mpeg" />
      </audio>
      <Slider
        max={audio.duration}
        value={[audio.progress]}
        onValueChange={([value]) => {
          audio.jump(value);
        }}
      />
      <Flex mt=".5rem">
        <Flex width="35%" justify="start">
          {timeToDisplayString(audio.progress)}
        </Flex>
        <Flex width="30%" justify="center" align="center" gap=".7rem">
          <Tooltip content="Sync scroll position with currently playing text">
            <IconButton
              variant="ghost"
              size="2"
              radius="full"
              onClick={() => setSyncScroll(!syncScroll)}
              highContrast={syncScroll}
            >
              <HiChevronDoubleDown />
            </IconButton>
          </Tooltip>

          <Tooltip content="Jump 5 seconds back">
            <IconButton
              variant="ghost"
              size="2"
              radius="full"
              onClick={audio.jumpBackward}
            >
              <HiOutlineBackward />
            </IconButton>
          </Tooltip>
          <IconButton
            variant="surface"
            size="2"
            radius="full"
            onClick={audio.isPlaying ? audio.pause : audio.play}
          >
            {audio.isPlaying ? <HiOutlinePause /> : <HiOutlinePlay />}
          </IconButton>

          <Tooltip content="Jump 15 seconds forward">
            <IconButton
              variant="ghost"
              size="2"
              radius="full"
              onClick={audio.jumpForward}
            >
              <HiOutlineForward />
            </IconButton>
          </Tooltip>

          <Tooltip content="Scroll to audio position">
            <IconButton
              variant="ghost"
              size="2"
              radius="full"
              onClick={() => audio.scrollTo(audio.progress * 1000)}
            >
              <LuMouse />
            </IconButton>
          </Tooltip>
        </Flex>
        <Flex width="35%" justify="end">
          {!Number.isNaN(audio.duration) && timeToDisplayString(audio.duration)}
        </Flex>
      </Flex>
    </Box>
  );
};
