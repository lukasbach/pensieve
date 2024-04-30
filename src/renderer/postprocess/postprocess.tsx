import { FC, useMemo } from "react";
import { Button, Flex, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { ProgressCard } from "./progress-card";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { EmptyState } from "../common/empty-state";

export const Postprocess: FC = () => {
  const { data } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });

  const hasQueueCompleted = useMemo(
    () => data?.processingQueue.every((item) => item.isDone || item.error),
    [data?.processingQueue],
  );

  if (!data) return null;

  if (data.processingQueue.length === 0) {
    return (
      <EmptyState
        title="Nothing to process"
        description="No sessions are queued for processing."
        icon={<HiOutlineCheckCircle size={32} />}
      />
    );
  }

  return (
    <Flex
      maxWidth="32rem"
      mx="auto"
      my="1rem"
      px="1rem"
      direction="column"
      gap="1rem"
    >
      <Flex align="center" gap=".5rem">
        <Text as="div" size="1" style={{ flexGrow: "1" }}>
          {data.isRunning
            ? "Sessions are being processed..."
            : hasQueueCompleted
              ? "Postprocessing is finished."
              : "Postprocessing was cancelled. You can start it again."}
        </Text>
        <Button
          onClick={() => historyApi.clearPostProcessingQueue()}
          variant="soft"
          color="gray"
        >
          Clear list
        </Button>
        {data.isRunning && (
          <Button onClick={() => historyApi.stopPostProcessing()}>Stop</Button>
        )}
        {!data.isRunning && !hasQueueCompleted && (
          <Button onClick={() => historyApi.startPostProcessing()}>
            Start
          </Button>
        )}
      </Flex>

      {data.processingQueue.map((job, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <ProgressCard key={`${job.recordingId} ${idx}`} data={data} job={job} />
      ))}
    </Flex>
  );
};
