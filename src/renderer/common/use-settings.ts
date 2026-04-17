import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "../../query-keys";
import type { Settings } from "../../types";
import { mainApi } from "../api";

type SaveSettingsInput = Parameters<typeof mainApi.saveSettings>[0];
type UseSettingsResult = {
  settings: Settings | undefined;
  saveSettings: (partialSettings: SaveSettingsInput) => Promise<void>;
};

export const useSettings = (): UseSettingsResult => {
  const { data: settings } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });

  const saveSettings = useCallback(
    async (partialSettings: SaveSettingsInput) => {
      await mainApi.saveSettings(partialSettings);
    },
    [],
  );

  return {
    settings,
    saveSettings,
  };
};
