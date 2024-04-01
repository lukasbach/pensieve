import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { historyDetailsRoute } from "../router/router";
import { QueryKeys } from "../../query-keys";
import { historyApi } from "../api";
import { PageContainer } from "../common/page-container";
import { Transscript } from "./transscript";

export const DetailsScreen: FC = () => {
  const { id } = historyDetailsRoute.useParams();
  const { data: recording } = useQuery({
    queryKey: [QueryKeys.History, id],
    queryFn: () => historyApi.getRecordingMeta(id),
  });
  const { data: transcript } = useQuery({
    queryKey: [QueryKeys.Transcript, id],
    queryFn: () => historyApi.getRecordingTranscript(id),
  });
  const { data: mp3 } = useQuery({
    queryKey: [QueryKeys.AudioFile, id],
    queryFn: () => historyApi.getRecordingAudioFile(id),
  });

  const [progress, setProgress] = useState(0);
  const audioTag = useRef<HTMLAudioElement>(null);

  const jump = useCallback(
    (time: number) => {
      if (!audioTag.current) return;
      audioTag.current.pause();
      audioTag.current.currentTime = time;
      audioTag.current.play();
      setProgress(time);
    },
    [audioTag],
  );

  const pause = useCallback(() => {
    if (!audioTag.current) return;
    audioTag.current.pause();
  }, []);

  useEffect(() => {
    if (!audioTag.current) return;
    audioTag.current.load();
  }, []);

  return (
    <PageContainer title={recording?.name ?? "Untitled Recording"}>
      {mp3 && (
        <audio
          preload="auto"
          ref={audioTag}
          controls
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        >
          <source src={`recording://${id}`} type="audio/mpeg" />
        </audio>
      )}
      {progress}
      {transcript && (
        <Transscript
          isPlaying={audioTag.current?.paused === false}
          transcript={transcript}
          progress={progress}
          onJump={jump}
          onPause={pause}
        />
      )}
    </PageContainer>
  );
};
