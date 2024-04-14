import { FC, useEffect, useState } from "react";
import { timeToDisplayString } from "../../utils";

export const Timer: FC<{ isRunning: boolean }> = ({ isRunning }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return () => {};
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  return <>{timeToDisplayString(time)}</>;
};
