import { FC } from "react";
import { Flex } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { ProgressCard } from "./progress-card";
import { getProgressData } from "../../main/domain/postprocess";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";

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
  const { data } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });

  if (!data) return null;

  return (
    <Flex maxWidth="32rem" mx="auto" my="1rem" direction="column" gap="1rem">
      {[...data.doneList, ...data.processingQueue].map((item) => (
        <ProgressCard key={item} id={item} data={data} />
      ))}
    </Flex>
  );
};
