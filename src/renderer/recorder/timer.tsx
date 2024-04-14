import { FC, useEffect, useState } from "react";
import { timeToDisplayString } from "../../utils";

export const Timer: FC<{ start: number }> = ({ start }) => {
  const [time, setTime] = useState(start);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <>{timeToDisplayString(time, false)}</>;
};
