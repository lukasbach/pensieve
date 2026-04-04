import { FC, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Select,
  Slider,
  Tooltip,
} from "@radix-ui/themes";
import {
  HiChevronDoubleDown,
  HiOutlineBackward,
  HiOutlineForward,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";
import { LuMouse } from "react-icons/lu";
import { useDebouncedEffect } from "@react-hookz/web";
import { useQuery } from "@tanstack/react-query";
import { useManagedAudio } from "./use-managed-audio";
import { timeToDisplayString } from "../../utils";
import { mainApi } from "../api";

const playbackSpeedOptions = [
  "0.75",
  "1",
  "1.25",
  "1.5",
  "1.75",
  "2",
  "2.5",
  "3",
] as const;

export const AudioControls: FC<{
  audio: ReturnType<typeof useManagedAudio>;
  id: string;
}> = ({ audio, id }) => {
  const [syncScroll, setSyncScroll] = useState(false);

  const { data: audioPort } = useQuery({
    queryKey: ["audioPort"],
    queryFn: () => mainApi.getAudioPort(),
  });

  const { data: audioSecret } = useQuery({
    queryKey: ["audioSecret"],
    queryFn: () => mainApi.getAudioSecret(),
  });

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
        {audioPort && audioSecret && (
          <source
            src={`http://localhost:${audioPort}/audio/${id}?auth=${audioSecret}`}
            type="audio/mpeg"
          />
        )}
      </audio>
      <Slider
        max={audio.duration}
        value={[audio.progress]}
        onValueChange={([value]) => {
          audio.jump(value);
        }}
      />
      <Flex mt=".5rem" align="center">
        <Flex style={{ flex: 1 }} justify="start">
          {timeToDisplayString(audio.progress)}
        </Flex>
        <Flex justify="center" align="center" gap=".7rem">
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

          <Tooltip content="Playback speed">
            <Box style={{ width: "4.75rem" }}>
              <Select.Root
                value={audio.playbackRate.toString()}
                onValueChange={(value) => {
                  audio.setPlaybackRate(Number(value));
                }}
              >
                <Select.Trigger />
                <Select.Content position="popper">
                  {playbackSpeedOptions.map((speed) => (
                    <Select.Item key={speed} value={speed}>
                      {`x${speed}`}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Tooltip>
        </Flex>
        <Flex style={{ flex: 1 }} justify="end">
          {!Number.isNaN(audio.duration) && timeToDisplayString(audio.duration)}
        </Flex>
      </Flex>
    </Box>
  );
};
