import { memo, useMemo } from "react";
import { RecordingMeta, RecordingTranscriptItem } from "../../../types";
import { useManagedAudio } from "../use-managed-audio";
import { isInRange, useEvent } from "../../../utils";
import { TranscriptItemUi } from "./transcript-item-ui";
import { Screenshot } from "./screenshot";
import { TimeframedComment } from "./timeframed-comment";

export const TranscriptItem = memo<{
  item: RecordingTranscriptItem;
  priorItem?: RecordingTranscriptItem;
  nextItem?: RecordingTranscriptItem;
  audio: ReturnType<typeof useManagedAudio>;
  meta: RecordingMeta;
  updateMeta: (update: Partial<RecordingMeta>) => Promise<void>;
  recordingId: string;
}>(({ item, priorItem, nextItem, audio, meta, updateMeta, recordingId }) => {
  const text = item.text.trim();
  const time = new Date();
  time.setMilliseconds(item.offsets.from);
  const isProgressAtItem =
    audio.progress !== 0 &&
    audio.progress * 1000 >= item.offsets.from &&
    audio.progress * 1000 < item.offsets.to;
  const priorRange = useMemo(
    () =>
      [
        priorItem?.offsets.from ?? Number.MIN_SAFE_INTEGER,
        item.offsets.from,
      ] as const,
    [item.offsets.from, priorItem?.offsets.from],
  );
  const nextRange = useMemo(
    () =>
      [
        item.offsets.to,
        nextItem?.offsets.to ?? Number.MAX_SAFE_INTEGER,
      ] as const,
    [item.offsets.to, nextItem?.offsets.to],
  );

  const isHighlighted = useMemo(
    () => meta.highlights?.some((time) => isInRange(time, priorRange)),
    [meta.highlights, priorRange],
  );

  const timeText = useMemo(() => {
    const min = Math.floor(item.offsets.from / 60000)
      .toString()
      .padStart(2, "0");
    const sec = Math.floor((item.offsets.from % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  }, [item.offsets.from]);

  const onTogglePlaying = useEvent(() => {
    if (audio.isPlaying && isProgressAtItem) {
      audio.pause();
    } else {
      audio.jump(item.offsets.from / 1000);
      audio.play();
    }
  });

  const onToggleHighlight = useEvent(() => {
    if (isHighlighted) {
      updateMeta({
        highlights: meta.highlights?.filter(
          (time) => !isInRange(time, priorRange),
        ),
      });
    } else {
      updateMeta({
        highlights: [...(meta.highlights ?? []), item.offsets.from - 0.1],
      });
    }
  });

  const timestampedNotes = useMemo(
    () =>
      (Object.entries(meta.timestampedNotes ?? {}) as any as [number, string][])
        .filter(([time]) => isInRange(time, nextRange))
        .map(([time, note]) => ({ time, note })),
    [],
  );

  const screenshots = useMemo(
    () =>
      (Object.entries(meta.screenshots ?? {}) as any as [number, string][])
        .filter(([time]) => isInRange(time, nextRange))
        .map(([time, file]) => ({ time, file })),
    [],
  );

  const nextItems = useMemo(
    () => (
      <>
        {timestampedNotes.map(({ time, note }) => (
          <TimeframedComment time={time} note={note} key={time} />
        ))}
        {screenshots.map(({ file }) => (
          <Screenshot url={`screenshot://${recordingId}/${file}`} key={file} />
        ))}
      </>
    ),
    [timestampedNotes, screenshots],
  );

  return (
    <TranscriptItemUi
      key={item.timestamps.from}
      text={text}
      speaker={item.speaker}
      isProgressAtItem={isProgressAtItem}
      isAudioPlaying={audio.isPlaying}
      isHighlighted={!!isHighlighted}
      isNewSpeaker={
        item.speaker !== priorItem?.speaker || text.startsWith("- ")
      }
      timeText={timeText}
      onTogglePlaying={onTogglePlaying}
      onToggleHighlight={onToggleHighlight}
      nextItems={nextItems}
    />
  );
});
