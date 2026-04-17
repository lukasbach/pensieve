import { FC, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import {
  HiMiniBars3,
  HiOutlineArrowDownOnSquare,
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineServerStack,
  HiSparkles,
} from "react-icons/hi2";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { useSettings } from "../common/use-settings";
import { useWindowedPromptText } from "../dialog/context";
import { useHistoryRecordings } from "./state";
import type { HistoryMenuSearch } from "./use-search";

const historyFilters = [
  { label: "All recordings", value: "all" },
  { label: "Unprocessed recordings", value: "unprocessed" },
  {
    label: "Recordings without embeddings",
    value: "missingEmbeddings",
  },
] as const;

const historyGroupByOptions = [
  { label: "None", value: "none" },
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const;

type HistoryMenuProps = {
  search: HistoryMenuSearch;
};

const getDefaultImportName = (filePath: string) => {
  return filePath.split(/[\\/]/).at(-1) ?? "Untitled import";
};

export const HistoryMenu: FC<HistoryMenuProps> = ({ search }) => {
  const { data: recordings } = useHistoryRecordings();
  const { data: postprocessing } = useQuery({
    queryKey: [QueryKeys.PostProcessing],
    queryFn: historyApi.getPostProcessingProgress,
  });
  const { settings, saveSettings } = useSettings();
  const embeddingsEnabled = settings?.embeddings?.enabled ?? false;
  const datahooksEnabled = settings?.datahooks?.enabled ?? false;
  const askImportName = useWindowedPromptText(
    "Import audio file",
    "Name of the recording",
  );
  const askImportDate = useWindowedPromptText(
    "Import audio file",
    "Date of the recording",
  );
  const recordingList = useMemo(
    () => Object.entries(recordings ?? {}),
    [recordings],
  );
  const processingRecordings = useMemo(
    () =>
      new Set(
        postprocessing?.processingQueue
          .filter(({ isDone }) => !isDone)
          .map(({ recordingId }) => recordingId) ?? [],
      ),
    [postprocessing?.processingQueue],
  );

  const queueJobs = async (
    jobs: Parameters<typeof historyApi.addToPostProcessingQueue>[0][],
  ) => {
    if (!jobs.length) {
      return;
    }

    await Promise.all(
      jobs.map((job) => historyApi.addToPostProcessingQueue(job)),
    );
    await historyApi.startPostProcessing();
  };

  const processAllUnprocessed = async () => {
    await queueJobs(
      recordingList
        .filter(
          ([recordingId, meta]) =>
            !meta.isPostProcessed && !processingRecordings.has(recordingId),
        )
        .map(([recordingId]) => ({ recordingId })),
    );
  };

  const computeMissingEmbeddings = async () => {
    await queueJobs(
      recordingList
        .filter(
          ([recordingId, meta]) =>
            meta.isPostProcessed &&
            !meta.hasEmbedding &&
            !processingRecordings.has(recordingId),
        )
        .map(([recordingId]) => ({
          recordingId,
          steps: ["embedding"],
        })),
    );
  };

  const runAllDatahooks = async () => {
    await queueJobs(
      recordingList
        .filter(
          ([recordingId, meta]) =>
            meta.isPostProcessed && !processingRecordings.has(recordingId),
        )
        .map(([recordingId]) => ({
          recordingId,
          steps: ["datahooks"],
        })),
    );
  };

  const unprocessedCount = recordingList.filter(
    ([recordingId, meta]) =>
      !meta.isPostProcessed && !processingRecordings.has(recordingId),
  ).length;
  const missingEmbeddingsCount = recordingList.filter(
    ([recordingId, meta]) =>
      meta.isPostProcessed &&
      !meta.hasEmbedding &&
      !processingRecordings.has(recordingId),
  ).length;
  const datahooksCount = recordingList.filter(
    ([recordingId, meta]) =>
      meta.isPostProcessed && !processingRecordings.has(recordingId),
  ).length;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant="outline" color="gray">
          <HiMiniBars3 />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={async () => {
            const file = await historyApi.showOpenImportDialog();
            if (!file) return;

            const name = await askImportName(
              getDefaultImportName(file.filePath),
            );
            if (!name) return;

            const started = await askImportDate(new Date().toISOString());
            if (!started) return;

            await historyApi.importRecording(file.filePath, {
              name,
              started,
            });
          }}
        >
          <HiOutlineArrowDownOnSquare /> Import audio file
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Filter</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {historyFilters.map(({ label, value }) => (
              <DropdownMenu.Item
                key={value}
                onClick={() => search.setHistoryFilter(value)}
              >
                <HiOutlineCheck
                  style={{ opacity: search.historyFilter === value ? 1 : 0 }}
                />
                {label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Group by</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {historyGroupByOptions.map(({ label, value }) => (
              <DropdownMenu.Item
                key={value}
                onClick={async () => {
                  search.setHistoryGroupBy(value);
                  await saveSettings({ ui: { historyGroupBy: value } });
                }}
              >
                <HiOutlineCheck
                  style={{ opacity: search.historyGroupBy === value ? 1 : 0 }}
                />
                {label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Bulk actions</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item
              onClick={processAllUnprocessed}
              disabled={unprocessedCount === 0}
            >
              <HiOutlineDocumentText /> Process all unprocessed
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={computeMissingEmbeddings}
              disabled={!embeddingsEnabled || missingEmbeddingsCount === 0}
            >
              <HiSparkles /> Compute missing embeddings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={runAllDatahooks}
              disabled={!datahooksEnabled || datahooksCount === 0}
            >
              <HiOutlineServerStack /> Run all datahooks
            </DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
