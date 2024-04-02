import { FC } from "react";
import { Button, Heading, Spinner, Text } from "@radix-ui/themes";
import {
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import type { getProgressData } from "../../main/domain/postprocess";
import { ProgressStep } from "./progress-step";
import { useHistoryRecordings } from "../history/state";
import { ProgressCardWrapper } from "./progress-card-wrapper";
import { historyApi } from "../api";

const allSteps = ["modelDownload", "wav", "mp3", "whisper", "summary"] as const;

export const ProgressCard: FC<{
  id: string;
  data: Awaited<ReturnType<typeof getProgressData>>;
}> = ({ id, data }) => {
  const { data: recordings } = useHistoryRecordings();
  const recording = recordings?.[id];
  const name = recording?.name ?? "Untitled recording";

  if (data.errors[id]) {
    return (
      <ProgressCardWrapper
        header={<Text color="red">{name}</Text>}
        icon={<HiOutlineExclamationTriangle color="var(--red-11)" />}
      >
        <pre>{data.errors[id]}</pre>
      </ProgressCardWrapper>
    );
  }

  if (data.doneList.includes(id)) {
    return (
      <ProgressCardWrapper
        header={
          <Text color="green">{recording?.name ?? "Untitled recording"}</Text>
        }
        icon={<HiOutlineCheckCircle color="var(--green-11)" />}
      />
    );
  }

  if (data.currentlyProcessing === id) {
    return (
      <ProgressCardWrapper
        icon={<Spinner size="3" />}
        header={
          <>
            <Heading>{name}</Heading>
            <Text>File is processing...</Text>
          </>
        }
        actions={
          <Button onClick={() => historyApi.stopPostProcessing()}>Stop</Button>
        }
      >
        {allSteps.map((item, index) => (
          <ProgressStep
            key={item}
            label={item}
            isRunning={item === data.currentStep}
            isDone={allSteps.indexOf(data.currentStep as any) > index}
            progress={data.progress[item] ?? 0}
          />
        ))}
      </ProgressCardWrapper>
    );
  }

  return (
    <ProgressCardWrapper
      icon={<HiOutlineEllipsisHorizontalCircle />}
      header={<Text>{recording?.name ?? "Untitled recording"}</Text>}
    />
  );
};
