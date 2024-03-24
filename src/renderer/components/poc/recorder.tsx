import { FC, useEffect, useState } from "react";
import type { DesktopCapturerSource } from "electron";
import { mainApi } from "../../api";

export const Recorder: FC<{}> = () => {
  const [sources, setSources] = useState<DesktopCapturerSource[]>([]);
  const [recorder, setRecorder] = useState<MediaRecorder>();

  useEffect(() => {
    mainApi.getSources().then((sources) => {
      setSources(sources);
      console.log(sources);
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
                  // video: {
                  //   deviceId: source.id,
                  // },
                  // audio: false,
                  // video: {
                  //   mandatory: {
                  //     chromeMediaSource: "desktop",
                  //     chromeMediaSourceId: source.id,
                  //   },
                  // } as any,
                  audio: {
                    mandatory: {
                      chromeMediaSource: "desktop",
                      chromeMediaSourceId: source.id,
                      sampleRate: 48000,
                      sampleSize: 16,
                      channelCount: 2,
                    },
                  },
                  video: {
                    mandatory: {
                      chromeMediaSource: "desktop",
                      chromeMediaSourceId: source.id,
                      minWidth: 1280,
                      maxWidth: 1280,
                      minHeight: 720,
                      maxHeight: 720,
                      maxFrameRate: 1,
                    },
                  },
                });
                const recorder = new MediaRecorder(usermedia, {});
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
              const blob = new Blob([e.data], { type: "video/mp4" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "recording.mp4";
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
