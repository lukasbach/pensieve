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

const readSettings = async (
  fallback: Settings | {},
): Promise<Settings | {}> => {
  try {
    return fs.existsSync(settingsFile) ? await fs.readJSON(settingsFile) : {};
  } catch (e) {
    console.error("Error reading settings file, using fallback", e);
    return fallback;
  }
};

export const initSettingsFile = async () => {
  if (!fs.existsSync(settingsFile)) {
    await fs.promises.writeFile(settingsFile, "{}", { encoding: "utf-8" });
  }
};

export const existsSettingsFile = () => fs.existsSync(settingsFile);

export const getSettings = async () => {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const merged = deepmerge(defaultSettings, await readSettings({}));
    cachedSettings = merged;
    return merged;
  } catch (e) {
    console.error(
      "Error merging settings while reading, using default settings",
      e,
    );
    return defaultSettings;
  }
};

export const saveSettings = async (partialSettings: DeepPartial<Settings>) => {
  if (partialSettings.core?.recordingsFolder) {
    await fs.ensureDir(partialSettings.core.recordingsFolder);
  }
  const settings = await readSettings({});
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
