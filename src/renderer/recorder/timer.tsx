import { FC, useEffect, useState } from "react";
import { timeToDisplayString } from "../../utils";

export const Timer: FC<{ start: number | undefined }> = ({ start }) => {
  const [time, setTime] = useState(start ?? 0);

  useEffect(() => {
    setTime(start ?? 0);
  }, [start]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return start ? <>{timeToDisplayString(time, false)}</> : null;
};
