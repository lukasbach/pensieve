import { useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const useIsTray = () => {
  const { tray: initialTrayValue } = useSearch({ strict: false });
  const [isTray, setIsTray] = useState(initialTrayValue);
  useEffect(() => (window as any).ipcApi.onSetIsTray(setIsTray), []);
  return isTray;
};
