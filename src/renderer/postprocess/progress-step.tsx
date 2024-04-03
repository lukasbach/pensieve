import { FC } from "react";
import { Box, Flex, Progress, Spinner, Text } from "@radix-ui/themes";
import {
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
} from "react-icons/hi2";

export const ProgressStep: FC<{
  label: string;
  isRunning?: boolean;
  isDone?: boolean;
  progress: number | null | undefined;
}> = ({ label, isRunning, progress, isDone }) => {
  return (
    <Box>
      <Flex align="center">
        <Flex align="center" mr=".5rem">
          {isRunning ? (
            <Spinner />
          ) : isDone ? (
            <HiOutlineCheckCircle color="var(--green-11)" />
          ) : (
            <HiOutlineEllipsisHorizontalCircle />
          )}
        </Flex>

        <Flex width="100%">
          <Text
            as="p"
            color={isDone ? "green" : undefined}
            style={{ flexGrow: 1 }}
          >
            {isRunning ? `${label}...` : label}
          </Text>
          {isRunning && progress !== undefined && progress !== null && (
            <Text color="gray">
              {Math.min(Math.round(progress * 100), 100)}%
            </Text>
          )}
        </Flex>
      </Flex>
      {isRunning && progress !== undefined && progress !== null && (
        <Progress value={Math.min(progress * 100)} mt=".2rem" mb=".8rem" />
      )}
    </Box>
  );
};
