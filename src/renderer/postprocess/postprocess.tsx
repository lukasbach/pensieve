import { FC } from "react";
import { Flex } from "@radix-ui/themes";
import { ProgressCard } from "./progress-card";
import { getProgressData } from "../../main/domain/postprocess";

const mockData: Awaited<ReturnType<typeof getProgressData>> = {
  processingQueue: ["a", "b"],
  doneList: ["c", "d"],
  errors: { c: "error message" },
  isRunning: true,
  currentStep: "whisper",
  progress: {
    whisper: 0.23,
  } as any,
  currentlyProcessing: "a",
};

export const Postprocess: FC = () => {
  return (
    <Flex maxWidth="32rem" mx="auto" my="1rem" direction="column" gap="1rem">
      <ProgressCard id="a" data={mockData} />
      <ProgressCard id="b" data={mockData} />
      <ProgressCard id="c" data={mockData} />
      <ProgressCard id="d" data={mockData} />
    </Flex>
  );
};
