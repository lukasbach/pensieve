import { FC, useMemo, useState } from "react";
import { Flex, IconButton, TextField } from "@radix-ui/themes";
import { HiChevronDown, HiChevronUp, HiMagnifyingGlass } from "react-icons/hi2";
import { useDebouncedEffect } from "@react-hookz/web";
import { RecordingTranscript, RecordingTranscriptItem } from "../../types";
import { useEvent } from "../../utils";

export const SearchBar: FC<{
  transcript: RecordingTranscript;
  onJumpTo: (time: number) => void;
}> = ({ transcript, onJumpTo }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RecordingTranscriptItem[]>([]);
  const [currentResult, setCurrentResult] =
    useState<RecordingTranscriptItem | null>(null);

  const jumpToResult = useEvent((item?: RecordingTranscriptItem) => {
    if (!item || item === currentResult) return;
    onJumpTo(item.offsets.to);
    setCurrentResult(item);
  });

  useDebouncedEffect(
    () => {
      if (!search.length) {
        setResults([]);
        setCurrentResult(null);
        return;
      }
      const newResults = transcript.transcription.filter((item) =>
        item.text.toLowerCase().includes(search.toLowerCase()),
      );
      setResults(newResults);
      jumpToResult(newResults[0]);
    },
    [search],
    500,
    2000,
  );

  const resultIndex = useMemo(
    () => (currentResult ? results.indexOf(currentResult) : null),
    [currentResult, results],
  );

  return (
    <Flex maxWidth="22rem" gap="2px" align="center">
      <TextField.Root
        placeholder="Search transcript..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ flexGrow: "1" }}
      >
        <TextField.Slot>
          <HiMagnifyingGlass />
        </TextField.Slot>
        {results.length > 0 && (
          <TextField.Slot side="right">
            {(resultIndex ?? 0) + 1} / {results.length}
          </TextField.Slot>
        )}
        {results.length === 0 && search.length > 0 && (
          <TextField.Slot side="right">No results</TextField.Slot>
        )}
      </TextField.Root>
      {results.length > 0 && (
        <Flex gap="2px">
          <IconButton
            size="1"
            color="gray"
            variant="outline"
            onClick={() => jumpToResult(results.at((resultIndex ?? 0) - 1))}
          >
            <HiChevronUp />
          </IconButton>
          <IconButton
            size="1"
            color="gray"
            variant="outline"
            onClick={() => jumpToResult(results.at((resultIndex ?? 0) + 1))}
          >
            <HiChevronDown />
          </IconButton>
        </Flex>
      )}
    </Flex>
  );
};
