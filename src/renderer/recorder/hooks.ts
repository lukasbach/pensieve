import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";

export const useMicSources = () =>
  useQuery({
    queryKey: [QueryKeys.MicrophoneSources],
    queryFn: async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "audioinput");
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  }).data;

export const useScreenSources = () =>
  useQuery({
    queryKey: [QueryKeys.ScreenSources],
    queryFn: mainApi.getSources,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  }).data;
