import { FC } from "react";
import { Flex } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { ProgressCard } from "./progress-card";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";

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
