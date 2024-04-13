import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import deepmerge from "deepmerge";
import type { DeepPartial } from "@tanstack/react-router/dist/esm/utils";
import { Settings, defaultSettings } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";

const settingsFile = path.join(app.getPath("userData"), "settings.json");
let cachedSettings: Settings | null = null;

export const initSettingsFile = async () => {
  if (!fs.existsSync(settingsFile)) {
    await fs.writeJSON(settingsFile, {});
  }
};

export const existsSettingsFile = () => fs.existsSync(settingsFile);

export const getSettings = async () => {
  if (cachedSettings) {
    return cachedSettings;
  }

  const settings = fs.existsSync(settingsFile)
    ? await fs.readJSON(settingsFile)
    : {};
  const merged = deepmerge(defaultSettings, settings);

  cachedSettings = merged;
  return merged;
};

export const saveSettings = async (partialSettings: DeepPartial<Settings>) => {
  if (partialSettings.core?.recordingsFolder) {
    await fs.ensureDir(partialSettings.core.recordingsFolder);
  }
  const settings = fs.existsSync(settingsFile)
    ? await fs.readJSON(settingsFile)
    : {};
  const merged = deepmerge(settings, partialSettings);
  await fs.writeJSON(settingsFile, merged, {
    spaces: 2,
  });
  cachedSettings = deepmerge(
    deepmerge(cachedSettings ?? {}, defaultSettings),
    merged,
  ) as Settings;
  await invalidateUiKeys(QueryKeys.Settings);
  if (partialSettings.ui?.dark !== undefined) {
    await invalidateUiKeys(QueryKeys.Theme);
  }
};

export const reset = async () => {
  await fs.remove(settingsFile);
  cachedSettings = null;
  await invalidateUiKeys(QueryKeys.Settings);
  await invalidateUiKeys(QueryKeys.Theme);
};
