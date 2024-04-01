import { useCallback, useEffect, useRef, useState } from "react";

export const useManagedAudio = () => {
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
      audioTag.current.currentTime + 10,
    );
  }, []);

  const jumpBackward = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.currentTime = Math.max(
      0,
      audioTag.current.currentTime - 10,
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
  };
};
