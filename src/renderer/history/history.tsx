import { FC, useMemo } from "react";
import {
  Box,
  DropdownMenu,
  Flex,
  IconButton,
  TextField,
} from "@radix-ui/themes";
import { HiMiniBars3, HiOutlineArrowDownOnSquare } from "react-icons/hi2";
import { useHistoryRecordings } from "./state";
import { HistoryItem } from "./history-item";
import { useSearch } from "./use-search";
import { historyApi } from "../api";
import { usePromptText } from "../dialog/context";

export const History: FC = () => {
  const { data: recordings } = useHistoryRecordings();
  const { setSearch, searchResults, filter } = useSearch();
  const recordingList = useMemo(
    () => Object.entries(recordings || {}),
    [recordings],
  );

  const askImportName = usePromptText(
    "Import audio file",
    "Name of the recording",
  );
  const askImportDate = usePromptText(
    "Import audio file",
    "Date of the recording",
  );

  return (
    <Box p="1rem">
      <Flex gap=".5rem">
        <TextField.Root
          style={{ flexGrow: "1" }}
          placeholder="Search recordings..."
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

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
                  file.filePath.split("/").at(-1)?.split("\\").at(-1) ??
                    "Untitled import",
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
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
      {recordingList.filter(filter).map(([id, meta], idx, arr) => (
        <HistoryItem
          key={id}
          id={id}
          recording={meta}
          priorItemDate={arr[idx - 1]?.[1].started}
          searchText={searchResults?.[id] as string}
        />
      ))}
    </Box>
  );
};
