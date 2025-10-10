import { FC } from "react";
import { Heading, Spinner, Text } from "@radix-ui/themes";
import {
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { ProgressStep } from "./progress-step";
import { useHistoryRecordings } from "../history/state";
import { ProgressCardWrapper } from "./progress-card-wrapper";
import { PostProcessingJob } from "../../types";
import type { getProgressData } from "../../main/domain/postprocess";

const allSteps = [
  "wav",
  "mp3",
  "modelDownload",
  "whisper",
  "summary",
  "datahooks",
  "vectorSearch",
] as const;
const stepLabels = {
  modelDownload: "Downloading model",
  wav: "Preparing audio",
  mp3: "Generating MP3 file",
  whisper: "Transcribing audio",
  summary: "Generating summary",
  datahooks: "Running datahooks",
  vectorSearch: "Building search index",
};

export const ProgressCard: FC<{
  job: PostProcessingJob;
  data: Awaited<ReturnType<typeof getProgressData>>;
}> = ({ job, data }) => {
  const { data: recordings } = useHistoryRecordings();
  const recording = recordings?.[job.recordingId];
  const name = recording?.name ?? "Untitled recording";

  if (job.error) {
    return (
      <ProgressCardWrapper
        header={<Text color="red">{name}</Text>}
        icon={<HiOutlineExclamationTriangle color="var(--red-11)" />}
      >
        <pre
          style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px" }}
        >
          {job.error}
        </pre>
      </ProgressCardWrapper>
    );
  }

  if (job.isDone) {
    return (
      <ProgressCardWrapper
        header={
          <Text color="green">{recording?.name ?? "Untitled recording"}</Text>
        }
        icon={<HiOutlineCheckCircle color="var(--green-11)" />}
      />
    );
  }

  if (job.isRunning) {
    return (
      <ProgressCardWrapper
        icon={<Spinner size="3" />}
        header={
          <>
            <Heading>{name}</Heading>
            <Text>File is processing...</Text>
          </>
        }
      >
        {allSteps
          .filter((step) => !job.steps || job.steps.includes(step))
          .map((item, index) => (
            <ProgressStep
              key={item}
              label={stepLabels[item]}
              isRunning={item === data.currentStep}
              isDone={allSteps.indexOf(data.currentStep as any) > index}
              progress={data.progress[item]}
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
