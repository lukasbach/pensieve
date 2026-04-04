import { z } from "zod";
import { RecordingMeta, RecordingTranscriptItem } from "../../types";
import * as history from "./history";
import * as searchIndex from "./search";
import * as settings from "./settings";
import { openRecordingWindow } from "./windows";

const resultLimit = 20;
const transcriptMatchLimit = 5;

type QueryRecordingsArgs = {
  search?: string;
  startDate?: string;
  endDate?: string;
  recordingId?: string;
  offset?: number;
};

type ReadTranscriptArgs = {
  recordingId: string;
  startLine?: number;
  length?: number;
};

type RecordingDetailsArgs = {
  recordingId: string;
};

type OpenRecordingArgs = {
  recordingId: string;
  highlightedLine?: number;
};

type McpTranscriptLine = RecordingTranscriptItem & {
  lineIndex: number;
  lineNumber: number;
  score?: number;
};

type McpToolDefinition = {
  description: string;
  execute: (args: any) => Promise<any>;
  inputSchema: z.ZodTypeAny;
  name: string;
  summarizeResult: (result: any) => string;
};

const parseDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getRecordingStartedAt = (meta: RecordingMeta) => {
  const parsed = new Date(meta.started);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const sortEntriesByStartedDesc = (
  [, leftMeta]: [string, RecordingMeta],
  [, rightMeta]: [string, RecordingMeta],
) => getRecordingStartedAt(rightMeta) - getRecordingStartedAt(leftMeta);

const toTranscriptLine = (
  line: RecordingTranscriptItem,
  lineIndex: number,
  score?: number,
) =>
  ({
    ...line,
    lineIndex,
    lineNumber: lineIndex + 1,
    ...(typeof score === "number" ? { score } : {}),
  }) satisfies McpTranscriptLine;

const filterRecordings = (
  recordings: [string, RecordingMeta][],
  {
    recordingId,
    startDate,
    endDate,
  }: Pick<QueryRecordingsArgs, "recordingId" | "startDate" | "endDate">,
) => {
  const start = parseDate(startDate)?.getTime();
  const end = parseDate(endDate)?.getTime();

  return recordings.filter(([currentRecordingId, meta]) => {
    if (recordingId && currentRecordingId !== recordingId) {
      return false;
    }

    const startedAt = getRecordingStartedAt(meta);

    if (typeof start === "number" && startedAt < start) {
      return false;
    }

    if (typeof end === "number" && startedAt > end) {
      return false;
    }

    return true;
  });
};

const getSafeOffset = (offset?: number) => {
  return Number.isInteger(offset) && offset && offset > 0 ? offset : 0;
};

const getTextMatchedLines = async (recordingId: string, query: string) => {
  const transcript = await history.getRecordingTranscript(recordingId);
  const normalizedQuery = query.trim().toLowerCase();

  if (!transcript || !normalizedQuery.length) {
    return [];
  }

  return transcript.transcription
    .map((line, lineIndex) => toTranscriptLine(line, lineIndex))
    .filter((line) => line.text.toLowerCase().includes(normalizedQuery))
    .slice(0, transcriptMatchLimit);
};

const queryRecordings = async ({
  endDate,
  offset,
  recordingId,
  search,
  startDate,
}: QueryRecordingsArgs) => {
  const recordings = Object.entries(await history.listRecordings()) as [
    string,
    RecordingMeta,
  ][];
  const filteredRecordings = filterRecordings(recordings, {
    endDate,
    recordingId,
    startDate,
  });
  const safeOffset = getSafeOffset(offset);
  const normalizedSearch = search?.trim();

  if (!normalizedSearch?.length) {
    const orderedRecordings = filteredRecordings.sort(sortEntriesByStartedDesc);

    return {
      items: orderedRecordings
        .slice(safeOffset, safeOffset + resultLimit)
        .map(([currentRecordingId, meta]) => ({
          matchedLines: [] as McpTranscriptLine[],
          meta,
          recordingId: currentRecordingId,
        })),
      limit: resultLimit,
      mode: "all" as const,
      offset: safeOffset,
      totalResults: orderedRecordings.length,
    };
  }

  const useSemanticSearch = (await settings.getSettings()).embeddings.enabled;

  const searchResponse = await searchIndex.search(normalizedSearch, {
    useSemanticSearch,
  });
  const filteredRecordingsById = new Map(filteredRecordings);

  if (useSemanticSearch) {
    const orderedIds = searchResponse.orderedIds.filter((currentRecordingId) =>
      filteredRecordingsById.has(currentRecordingId),
    );

    return {
      items: orderedIds
        .slice(safeOffset, safeOffset + resultLimit)
        .map((currentRecordingId) => {
          const meta = filteredRecordingsById.get(
            currentRecordingId,
          ) as RecordingMeta;
          const match = searchResponse.matches[currentRecordingId];

          return {
            matchedLines: (match.matchedLines ?? []).map((line) => ({
              lineIndex: line.lineIndex,
              lineNumber: line.lineIndex + 1,
              offsets: line.offsets,
              recordingId: line.recordingId,
              score: line.score,
              speaker: line.speaker,
              text: line.text,
              timestamps: line.timestamps,
            })),
            meta,
            recordingId: currentRecordingId,
            score: match.score,
            snippet: match.snippet,
          };
        }),
      limit: resultLimit,
      mode: "semantic" as const,
      offset: safeOffset,
      totalResults: orderedIds.length,
    };
  }

  const matchedRecordings = filteredRecordings
    .filter(([currentRecordingId]) =>
      Boolean(searchResponse.matches[currentRecordingId]),
    )
    .sort(sortEntriesByStartedDesc);

  return {
    items: await Promise.all(
      matchedRecordings
        .slice(safeOffset, safeOffset + resultLimit)
        .map(async ([currentRecordingId, meta]) => ({
          matchedLines: await getTextMatchedLines(
            currentRecordingId,
            normalizedSearch,
          ),
          meta,
          recordingId: currentRecordingId,
          snippet: searchResponse.matches[currentRecordingId]?.snippet,
        })),
    ),
    limit: resultLimit,
    mode: "text" as const,
    offset: safeOffset,
    totalResults: matchedRecordings.length,
  };
};

const readTranscript = async ({
  length,
  recordingId,
  startLine,
}: ReadTranscriptArgs) => {
  const transcript = await history.getRecordingTranscript(recordingId);

  if (!transcript) {
    throw new Error(`Transcript not found for recording "${recordingId}"`);
  }

  const safeStartLine =
    Number.isInteger(startLine) && startLine && startLine > 0 ? startLine : 1;
  const safeLength =
    Number.isInteger(length) && length && length > 0 ? length : resultLimit;
  const offset = safeStartLine - 1;
  const lines = transcript.transcription
    .slice(offset, offset + safeLength)
    .map((line, lineOffset) => toTranscriptLine(line, offset + lineOffset));

  return {
    lines,
    recordingId,
    returnedLines: lines.length,
    startLine: safeStartLine,
    totalLines: transcript.transcription.length,
  };
};

const getRecordingDetails = async ({ recordingId }: RecordingDetailsArgs) => {
  const meta = await history.getRecordingMeta(recordingId);
  const transcript = await history.getRecordingTranscript(recordingId);

  return {
    hasTranscript: Boolean(transcript),
    meta,
    recordingId,
    transcriptLineCount: transcript?.transcription.length ?? 0,
  };
};

const openRecording = async ({
  highlightedLine,
  recordingId,
}: OpenRecordingArgs) => {
  await history.getRecordingMeta(recordingId);

  const safeHighlightedLine =
    Number.isInteger(highlightedLine) && highlightedLine && highlightedLine > 0
      ? highlightedLine
      : undefined;

  openRecordingWindow(recordingId, safeHighlightedLine);

  return {
    highlightedLine: safeHighlightedLine ?? null,
    ok: true,
    recordingId,
  };
};

const queryRecordingsTool = {
  description:
    "Query local Pensieve meeting recordings by id, date range, and search text. Search automatically uses semantic search when embeddings are enabled.",
  execute: queryRecordings,
  inputSchema: z.object({
    endDate: z.string().optional(),
    offset: z.number().int().min(0).optional(),
    recordingId: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
  }),
  name: "query-recordings",
  summarizeResult: (result: Awaited<ReturnType<typeof queryRecordings>>) => {
    const returnedCount = result.items.length;

    return returnedCount
      ? `Returned ${returnedCount} of ${result.totalResults} matching recordings.`
      : "No recordings matched the query.";
  },
} satisfies McpToolDefinition;

const readTranscriptTool = {
  description:
    "Read transcript lines from a local Pensieve meeting recording. Line numbers are 1-based.",
  execute: readTranscript,
  inputSchema: z.object({
    length: z.number().int().min(1).optional(),
    recordingId: z.string(),
    startLine: z.number().int().min(1).optional(),
  }),
  name: "read-transcript",
  summarizeResult: (result: Awaited<ReturnType<typeof readTranscript>>) =>
    result.returnedLines
      ? `Returned ${result.returnedLines} transcript lines starting at line ${result.startLine}.`
      : "No transcript lines were returned.",
} satisfies McpToolDefinition;

const recordingDetailsTool = {
  description:
    "Get the metadata, notes, and summary information for a Pensieve meeting recording.",
  execute: getRecordingDetails,
  inputSchema: z.object({
    recordingId: z.string(),
  }),
  name: "recording-details",
  summarizeResult: (result: Awaited<ReturnType<typeof getRecordingDetails>>) =>
    result.meta
      ? `Loaded details for recording "${result.recordingId}".`
      : `Recording "${result.recordingId}" was not found.`,
} satisfies McpToolDefinition;

const openRecordingTool = {
  description:
    "Open a Pensieve recording in the app, optionally highlighting a transcript line.",
  execute: openRecording,
  inputSchema: z.object({
    highlightedLine: z.number().int().min(1).optional(),
    recordingId: z.string(),
  }),
  name: "open-recording",
  summarizeResult: (result: Awaited<ReturnType<typeof openRecording>>) =>
    `Opened recording "${result.recordingId}" in Pensieve.`,
} satisfies McpToolDefinition;

const definitions: McpToolDefinition[] = [
  queryRecordingsTool,
  readTranscriptTool,
  recordingDetailsTool,
  openRecordingTool,
];

export const mcpTools = {
  definitions,
  getRecordingDetails,
  openRecording,
  queryRecordings,
  readTranscript,
};
