import { useEffect, useRef } from "react";
import { RecordingIpcEvents } from "../../types";

export const useRecorderIpcEvent = <T extends keyof RecordingIpcEvents>(
  event: T,
  handler: RecordingIpcEvents[T],
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return (window as any).ipcApi.recorderIpc.onEvent(event, (...args: any[]) =>
      (handlerRef.current as any)(...args),
    );
  }, [event]);
};
