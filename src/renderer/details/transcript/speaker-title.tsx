import { FC } from "react";
import { Avatar, Flex, Text } from "@radix-ui/themes";
import { HiOutlineUserCircle, HiOutlineUserGroup } from "react-icons/hi2";

export const SpeakerTitle: FC<{
  timeText: string;
  speaker: string;
}> = ({ timeText, speaker }) => {
  const speakerText = speaker === "0" ? "They" : speaker === "1" ? "Me" : "?";
  return (
    <Flex align="center">
      {/* eslint-disable-next-line no-nested-ternary */}
      {speakerText === "Me" ? (
        <Avatar fallback={<HiOutlineUserCircle />} size="2" />
      ) : speakerText === "They" ? (
        <Avatar fallback={<HiOutlineUserGroup />} size="2" />
      ) : (
        <Avatar fallback={speakerText[0]} size="2" />
      )}
      <Text weight="bold" ml=".5rem" style={{ flexGrow: 1 }}>
        {speakerText}
      </Text>
      <Text color="gray">{timeText}</Text>
    </Flex>
  );
};
