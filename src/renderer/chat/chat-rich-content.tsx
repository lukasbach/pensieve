import { FC, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Text } from "@radix-ui/themes";
import Markdown from "react-markdown";
import { HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";
import { QueryKeys } from "../../query-keys";
import { RecordingMeta, RecordingTranscript, RecordingTranscriptItem } from "../../types";
import { historyApi } from "../api";
import * as styles from "./chat.module.css";

type ChatContentSegment =
  | {
      content: string;
      id: string;
      type: "markdown";
    }
  | {
      highlightedLine?: number;
      id: string;
      recordingId: string;
      type: "recording";
    }
  | {
      id: string;
      length: number;
      recordingId: string;
      startLine: number;
      type: "recording-lines";
    };

type ChatRichContentProps = {
  content: string;
};

type TranscriptDisplayLine = {
  item: RecordingTranscriptItem;
  lineNumber: number;
};

const richElementPattern =
  /<(recording|recording-lines)\s+([^<>]*?)(?:\/\s*>|><\/\1\s*>)/gi;
const attributePattern =
  /([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const buildAttributeMap = (attributeSource: string) => {
  return [...attributeSource.matchAll(attributePattern)].reduce(
    (attributes, [, rawName, doubleQuotedValue, singleQuotedValue]) => {
      const name = rawName.toLowerCase();
      const value = (doubleQuotedValue ?? singleQuotedValue ?? "").trim();

      return {
        ...attributes,
        ...(value.length ? { [name]: value } : {}),
      };
    },
    {} as Record<string, string>,
  );
};

const parsePositiveInt = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const createMarkdownSegment = (content: string, id: string) => {
  return content.trim().length
    ? ({
        content,
        id,
        type: "markdown",
      } satisfies ChatContentSegment)
    : null;
};

const createRichSegment = (
  elementType: string,
  rawAttributes: string,
  id: string,
) => {
  const attributes = buildAttributeMap(rawAttributes);
  const recordingId = attributes.id ?? attributes.recordingid;

  if (!recordingId) {
    return null;
  }

  if (elementType === "recording") {
    const highlightedLine = parsePositiveInt(attributes.highlightedline);

    return {
      ...(highlightedLine ? { highlightedLine } : {}),
      id,
      recordingId,
      type: "recording",
    } satisfies ChatContentSegment;
  }

  const startLine = parsePositiveInt(attributes.startline);
  const length = parsePositiveInt(attributes.length);

  if (!startLine || !length) {
    return null;
  }

  return {
    id,
    length,
    recordingId,
    startLine,
    type: "recording-lines",
  } satisfies ChatContentSegment;
};

const parseContent = (content: string) => {
  const segments: ChatContentSegment[] = [];
  let lastIndex = 0;
  let markdownIndex = 0;
  let richIndex = 0;

  for (const match of content.matchAll(richElementPattern)) {
    const matchIndex = match.index ?? 0;
    const rawTag = match[0];
    const elementType = match[1];
    const rawAttributes = match[2];
    const leadingText = content.slice(lastIndex, matchIndex);

    const markdownSegment = createMarkdownSegment(
      leadingText,
      `markdown-${markdownIndex}`,
    );

    if (markdownSegment) {
      segments.push(markdownSegment);
      markdownIndex += 1;
    }

    const richSegment = createRichSegment(
      elementType,
      rawAttributes,
      `rich-${richIndex}`,
    );

    if (richSegment) {
      segments.push(richSegment);
      richIndex += 1;
    } else {
      const rawMarkdownSegment = createMarkdownSegment(
        rawTag,
        `markdown-${markdownIndex}`,
      );

      if (rawMarkdownSegment) {
        segments.push(rawMarkdownSegment);
        markdownIndex += 1;
      }
    }

    lastIndex = matchIndex + rawTag.length;
  }

  const trailingMarkdown = createMarkdownSegment(
    content.slice(lastIndex),
    `markdown-${markdownIndex}`,
  );

  return trailingMarkdown ? [...segments, trailingMarkdown] : segments;
};

const getRecordingTitle = (meta: RecordingMeta, recordingId: string) => {
  return meta.name?.trim().length ? meta.name : recordingId;
};

const formatRecordingDate = (started: string) => {
  return new Date(started).toLocaleString();
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown chat rendering error";
};

const getTranscriptLines = (
  transcript: RecordingTranscript | null | undefined,
  startLine: number,
  length: number,
) => {
  if (!transcript) {
    return [] as TranscriptDisplayLine[];
  }

  return transcript.transcription
    .slice(startLine - 1, startLine - 1 + length)
    .map((item, index) => ({
      item,
      lineNumber: startLine + index,
    }));
};

const getRecordingSnippetLines = (
  transcript: RecordingTranscript | null | undefined,
  highlightedLine: number,
) => {
  if (!transcript) {
    return [] as TranscriptDisplayLine[];
  }

  const startLine = Math.max(highlightedLine - 1, 1);
  const endLine = Math.min(highlightedLine + 1, transcript.transcription.length);

  return transcript.transcription
    .slice(startLine - 1, endLine)
    .map((item, index) => ({
      item,
      lineNumber: startLine + index,
    }));
};

const RecordingLineCard: FC<{
  item: RecordingTranscriptItem;
  lineNumber: number;
  isHighlighted?: boolean;
  onClick?: () => Promise<void> | void;
  title: string;
}> = ({ item, lineNumber, isHighlighted, onClick, title }) => {
  const className = [
    onClick ? styles.richLineButton : styles.richLine,
    isHighlighted ? styles.richLineHighlighted : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = <div className={styles.richLineText}>{item.text}</div>;

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-label={`Open transcript line ${lineNumber} in ${title}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <Box className={className}>
      {content}
    </Box>
  );
};

const RecordingCard: FC<{
  recordingId: string;
  highlightedLine?: number;
}> = ({ recordingId, highlightedLine }) => {
  const { data: meta, error: metaError, isLoading: isMetaLoading } = useQuery({
    queryKey: [QueryKeys.History, recordingId],
    queryFn: () => historyApi.getRecordingMeta(recordingId),
  });
  const {
    data: transcript,
    error: transcriptError,
    isLoading: isTranscriptLoading,
  } = useQuery({
    enabled: typeof highlightedLine === "number",
    queryKey: [QueryKeys.Transcript, recordingId],
    queryFn: () => historyApi.getRecordingTranscript(recordingId),
  });

  if (isMetaLoading || (highlightedLine && isTranscriptLoading)) {
    return (
      <Box className={styles.richCard}>
        <Text className={styles.richCardStatus}>Loading recording...</Text>
      </Box>
    );
  }

  if (!meta || metaError || (highlightedLine && transcriptError)) {
    return (
      <Box className={`${styles.richCard} ${styles.richCardError}`}>
        <Text className={styles.richCardStatus}>
          Unable to load recording {recordingId}: {getErrorMessage(metaError ?? transcriptError)}
        </Text>
      </Box>
    );
  }

  const title = getRecordingTitle(meta, recordingId);
  const snippetLines = highlightedLine
    ? getRecordingSnippetLines(transcript, highlightedLine)
    : [];

  return (
    <Box className={styles.richCard}>
      <div className={styles.richCardHeader}>
        <div className={styles.richCardMeta}>
          <div className={styles.richCardTitleRow}>
            <div className={styles.richCardTitle}>{title}</div>
            <Button
              variant="outline"
              size="1"
              aria-label={`Open recording ${title}`}
              onClick={async () =>
                historyApi.openRecordingDetailsWindow(recordingId, highlightedLine)
              }
            >
              <HiOutlineArrowTopRightOnSquare /> Open
            </Button>
          </div>
          <div className={styles.richCardDate}>{formatRecordingDate(meta.started)}</div>
        </div>
      </div>

      {highlightedLine ? (
        <div className={styles.richCardBody}>
          {snippetLines.length ? (
            <div className={styles.richLineGroup}>
              {snippetLines.map((line) => (
                <RecordingLineCard
                  key={`${recordingId}-${line.lineNumber}`}
                  item={line.item}
                  lineNumber={line.lineNumber}
                  isHighlighted={line.lineNumber === highlightedLine}
                  title={title}
                  onClick={async () =>
                    historyApi.openRecordingDetailsWindow(recordingId, line.lineNumber)
                  }
                />
              ))}
            </div>
          ) : (
            <Text className={styles.richCardStatus}>
              Transcript line {highlightedLine} is not available for this recording.
            </Text>
          )}
        </div>
      ) : null}
    </Box>
  );
};

const RecordingLinesCard: FC<{
  recordingId: string;
  startLine: number;
  length: number;
}> = ({ recordingId, startLine, length }) => {
  const { data: meta, error: metaError, isLoading: isMetaLoading } = useQuery({
    queryKey: [QueryKeys.History, recordingId],
    queryFn: () => historyApi.getRecordingMeta(recordingId),
  });
  const {
    data: transcript,
    error: transcriptError,
    isLoading: isTranscriptLoading,
  } = useQuery({
    queryKey: [QueryKeys.Transcript, recordingId],
    queryFn: () => historyApi.getRecordingTranscript(recordingId),
  });

  if (isMetaLoading || isTranscriptLoading) {
    return (
      <Box className={styles.richCard}>
        <Text className={styles.richCardStatus}>Loading transcript...</Text>
      </Box>
    );
  }

  if (!meta || metaError || transcriptError) {
    return (
      <Box className={`${styles.richCard} ${styles.richCardError}`}>
        <Text className={styles.richCardStatus}>
          Unable to load transcript for {recordingId}: {getErrorMessage(metaError ?? transcriptError)}
        </Text>
      </Box>
    );
  }

  const title = getRecordingTitle(meta, recordingId);
  const transcriptLines = getTranscriptLines(transcript, startLine, length);

  return (
    <Box className={styles.richCard}>
      <div className={styles.richCardHeader}>
        <div className={styles.richCardMeta}>
          <div className={styles.richCardTitleRow}>
            <div className={styles.richCardTitle}>{title}</div>
            <Button
              variant="outline"
              size="1"
              aria-label={`Open recording ${title}`}
              onClick={async () => historyApi.openRecordingDetailsWindow(recordingId)}
            >
              <HiOutlineArrowTopRightOnSquare /> Open
            </Button>
          </div>
          <div className={styles.richCardDate}>{formatRecordingDate(meta.started)}</div>
        </div>
      </div>

      <div className={styles.richCardBody}>
        {transcriptLines.length ? (
          <div className={styles.richLineGroup}>
            {transcriptLines.map((line) => (
              <RecordingLineCard
                key={`${recordingId}-${line.lineNumber}`}
                item={line.item}
                lineNumber={line.lineNumber}
                title={title}
                onClick={async () =>
                  historyApi.openRecordingDetailsWindow(recordingId, line.lineNumber)
                }
              />
            ))}
          </div>
        ) : (
          <Text className={styles.richCardStatus}>
            Transcript lines {startLine}-{startLine + length - 1} are not available for this recording.
          </Text>
        )}
      </div>
    </Box>
  );
};

export const ChatRichContent: FC<ChatRichContentProps> = ({ content }) => {
  const segments = useMemo(() => parseContent(content), [content]);

  return (
    <div className={styles.richContent}>
      {segments.map((segment) => {
        switch (segment.type) {
          case "markdown":
            return (
              <div key={segment.id} className={styles.richMarkdown}>
                <Markdown>{segment.content}</Markdown>
              </div>
            );
          case "recording":
            return (
              <RecordingCard
                key={segment.id}
                recordingId={segment.recordingId}
                highlightedLine={segment.highlightedLine}
              />
            );
          case "recording-lines":
            return (
              <RecordingLinesCard
                key={segment.id}
                recordingId={segment.recordingId}
                startLine={segment.startLine}
                length={segment.length}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};