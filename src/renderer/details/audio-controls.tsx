import { FC } from "react";
import { Box, Flex, IconButton, Slider } from "@radix-ui/themes";
import {
  HiOutlineBackward,
  HiOutlineForward,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";
import { useManagedAudio } from "./use-managed-audio";
import { timeToDisplayString } from "../../utils";

export const AudioControls: FC<{
  audio: ReturnType<typeof useManagedAudio>;
  id: string;
}> = ({ audio, id }) => {
  return (
    <Box px="1rem" py=".5rem" style={{ borderTop: `1px solid var(--gray-5)` }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio preload="auto" ref={audio.audioTag}>
        <source src={`recording://${id}`} type="audio/mpeg" />
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
          <IconButton
            variant="ghost"
            size="2"
            radius="full"
            onClick={audio.jumpBackward}
          >
            <HiOutlineBackward />
          </IconButton>
          <IconButton
            variant="surface"
            size="3"
            radius="full"
            onClick={audio.isPlaying ? audio.pause : audio.play}
          >
            {audio.isPlaying ? <HiOutlinePause /> : <HiOutlinePlay />}
          </IconButton>

          <IconButton
            variant="ghost"
            size="2"
            radius="full"
            onClick={audio.jumpForward}
          >
            <HiOutlineForward />
          </IconButton>
        </Flex>
        <Flex width="35%" justify="end">
          {!Number.isNaN(audio.duration) && timeToDisplayString(audio.duration)}
        </Flex>
      </Flex>
    </Box>
  );
};
