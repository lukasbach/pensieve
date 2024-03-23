import { FC, useEffect, useState } from "react";
import type { DesktopCapturerSource } from "electron";
import { mainApi } from "../../api";

export const Recorder: FC<{}> = () => {
  const [sources, setSources] = useState<DesktopCapturerSource[]>([]);
  const [recorder, setRecorder] = useState<MediaRecorder>();

  useEffect(() => {
    mainApi.getSources().then((sources) => {
      setSources(sources);
    });
  }, []);

  return (
    <>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>
            {source.name}
            <button
              onClick={async () => {
                const usermedia = await navigator.mediaDevices.getUserMedia({
                  video: false,
                  audio: {
                    mandatory: {
                      chromeMediaSource: "desktop",
                      chromeMediaSourceId: source.id,
                    },
                  } as any,
                });
                const recorder = new MediaRecorder(usermedia, {
                  mimeType: "audio/wav",
                });
                setRecorder(recorder);
                recorder.start();
              }}
            >
              Record
            </button>
          </li>
        ))}
      </ul>
      {recorder && (
        <button
          onClick={() => {
            recorder.stop();
            recorder.ondataavailable = (e) => {
              const blob = new Blob([e.data], { type: "audio/wav" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "recording.wav";
              a.click();
            };
          }}
        >
          Stop
        </button>
      )}
    </>
  );
};
