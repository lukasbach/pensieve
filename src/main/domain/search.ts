import path from "path";
import fs from "fs-extra";
import * as embeddings from "./embeddings";
import { RecordingMeta, RecordingTranscript } from "../../types";
import { getSettings } from "./settings";

const transcriptIndex: Record<string, string> = {};
const titleIndex: Record<string, string> = {};

const getRecordingsFolder = async () => {
  return (await getSettings()).core.recordingsFolder;
};

const getRecordingTranscript = async (recordingId: string) => {
  const file = path.join(
    await getRecordingsFolder(),
    recordingId,
    "transcript.json",
  );
  return fs.existsSync(file)
    ? ((await fs.readJson(file)) as RecordingTranscript)
    : null;
};

const listRecordingMetas = async () => {
  const recordingsFolder = await getRecordingsFolder();
  const recordingFolders = await fs.readdir(recordingsFolder);
  const visibleFolders = recordingFolders.filter(
    (folder) => !folder.startsWith("."),
  );
  const validFolders = await Promise.all(
    visibleFolders.map(async (folder) => {
      const stats = await fs.stat(path.join(recordingsFolder, folder));
      return stats.isDirectory() ? folder : null;
    }),
  );

  const items = await Promise.all(
    validFolders
      .filter((folder): folder is string => folder !== null)
      .map(
        async (recordingFolder) =>
          [
            recordingFolder,
            (await fs.readJson(
              path.join(recordingsFolder, recordingFolder, "meta.json"),
            )) as RecordingMeta,
          ] as const,
      ),
  );

  return items.reduce(
    (acc, [recordingId, meta]) => {
      acc[recordingId] = meta;
      return acc;
    },
    {} as Record<string, RecordingMeta>,
  );
};

export type SearchOptions = {
  useSemanticSearch?: boolean;
};

export type SearchResponse = {
  mode: "text" | "semantic";
  orderedIds: string[];
  matches: Record<
    string,
    {
      snippet?: string;
      score?: number;
      matchedLines?: embeddings.SemanticSearchMatch[];
    }
  >;
};

const createSearchSnippet = (text: string, query: string) => {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return undefined;
  }

  const snippetStart = Math.max(index - 20, 0);
  const snippetEnd = Math.min(index + normalizedQuery.length + 30, text.length);
  return `...${text.slice(snippetStart, snippetEnd)}...`;
};

export const addRecordingToIndex = async (recordingId: string) => {
  const transcript = await getRecordingTranscript(recordingId);
  if (!transcript) return;
  const text = transcript.transcription.map((line) => line.text).join(" - ");
  transcriptIndex[recordingId] = text;
};

export const updateRecordingName = (recordingId: string, name?: string) => {
  if (!name) {
    delete titleIndex[recordingId];
    return;
  }

  titleIndex[recordingId] = name;
};

export const removeRecordingFromIndex = (recordingId: string) => {
  delete transcriptIndex[recordingId];
  delete titleIndex[recordingId];
};

export const initializeSearchIndex = async () => {
  const recordings = await listRecordingMetas();
  for (const recordingId of Object.keys(recordings)) {
    await addRecordingToIndex(recordingId);
    const { name } = recordings[recordingId];
    updateRecordingName(recordingId, name);
  }
};

export const search = async (
  query: string,
  options: SearchOptions = {},
): Promise<SearchResponse> => {
  if (!query.trim().length) {
    return {
      matches: {},
      mode: options.useSemanticSearch ? "semantic" : "text",
      orderedIds: [],
    };
  }

  if (options.useSemanticSearch) {
    const results = await embeddings.semanticSearch(query);
    return {
      matches: results.reduce(
        (acc, result) => {
          acc[result.recordingId] = {
            matchedLines: result.matchedLines,
            score: result.score,
            snippet: result.snippet,
          };
          return acc;
        },
        {} as SearchResponse["matches"],
      ),
      mode: "semantic",
      orderedIds: results.map((result) => result.recordingId),
    };
  }

  const normalizedQuery = query.toLowerCase();
  const nameMatches = Object.entries(titleIndex)
    .filter(([, name]) => name.toLowerCase().includes(normalizedQuery))
    .map(([recordingId]) => [recordingId, {}] as const);
  const transcriptMatches = Object.entries(transcriptIndex)
    .map(
      ([recordingId, text]) =>
        [recordingId, createSearchSnippet(text, query)] as const,
    )
    .filter(([, snippet]) => Boolean(snippet))
    .map(([recordingId, snippet]) => [recordingId, { snippet }] as const);

  return {
    matches: [...nameMatches, ...transcriptMatches].reduce(
      (acc, [recordingId, match]) => {
        acc[recordingId] = {
          ...acc[recordingId],
          ...match,
        };
        return acc;
      },
      {} as SearchResponse["matches"],
    ),
    mode: "text",
    orderedIds: [],
  };
};
