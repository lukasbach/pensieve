import { useCallback, useEffect, useRef, useState } from "react";
import { RecordingTranscript } from "../../types";

export const useManagedAudio = (
  transcript: RecordingTranscript | undefined | null,
) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioTag = useRef<HTMLAudioElement>(null);

  const jump = useCallback(
    (time: number) => {
      if (!audioTag.current) return;
      // audioTag.current.pause();
      audioTag.current.currentTime = time;
      // audioTag.current.play();
    },
    [audioTag],
  );

  const scrollTo = useCallback(
    (time: number) => {
      if (!transcript) return;

      const closest = transcript.transcription.reduce(
        (old, { offsets }) => {
          const dist = Math.abs(offsets.from - time);
          return dist < old.dist ? { time: offsets.from, dist } : old;
        },
        { time: 0, dist: Number.MAX_SAFE_INTEGER },
      );

      const id = `transcript-item-${closest.time}`;
      const element = document.getElementById(id);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [transcript],
  );

  const pause = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.pause();
  }, []);

  const play = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.play();
  }, []);

  const jumpForward = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.currentTime = Math.min(
      audioTag.current.duration,
      audioTag.current.currentTime + 15,
    );
  }, []);

  const jumpBackward = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.currentTime = Math.max(
      0,
      audioTag.current.currentTime - 5,
    );
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const tag = audioTag.current;
    if (!tag) return () => {};

    if (!duration) {
      setDuration(tag.duration);
    }
    const timeUpdateListener = (e: any) => {
      setProgress(e.currentTarget?.currentTime);
    };
    const playListener = () => {
      setIsPlaying(true);
    };
    const pauseListener = () => {
      setIsPlaying(false);
    };

    tag.addEventListener("timeupdate", timeUpdateListener);
    tag.addEventListener("play", playListener);
    tag.addEventListener("pause", pauseListener);
    return () => {
      tag.removeEventListener("timeupdate", timeUpdateListener);
      tag.removeEventListener("play", playListener);
      tag.removeEventListener("pause", pauseListener);
    };
  });

  return {
    progress,
    jump,
    pause,
    audioTag,
    jumpForward,
    isPlaying,
    play,
    jumpBackward,
    duration,
    scrollTo,
  };
};
