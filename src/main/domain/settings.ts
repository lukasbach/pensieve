import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import deepmerge from "deepmerge";
import type { DeepPartial } from "@tanstack/react-router/dist/esm/utils";
import { Settings } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";

const settingsFile = path.join(app.getPath("userData"), "settings.json");

const defaultSettings: Settings = {
  ui: {
    dark: true,
  },
  whisper: {
    model: "ggml-base-q5_1",
  },
};

export const getSettings = async () => {
  const settings = fs.existsSync(settingsFile)
    ? await fs.readJSON(settingsFile)
    : {};
  return deepmerge(defaultSettings, settings);
};

export const saveSettings = async (partialSettings: DeepPartial<Settings>) => {
  const settings = fs.existsSync(settingsFile)
    ? await fs.readJSON(settingsFile)
    : {};
  await fs.writeJSON(settingsFile, deepmerge(settings, partialSettings), {
    spaces: 2,
  });
  await invalidateUiKeys(QueryKeys.Settings);
  if (partialSettings.ui?.dark !== undefined) {
    await invalidateUiKeys(QueryKeys.Theme);
  }
};
