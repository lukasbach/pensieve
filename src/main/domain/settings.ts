import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import deepmerge from "deepmerge";
import type { DeepPartial } from "@tanstack/react-router/dist/esm/utils";
import { Settings, defaultSettings } from "../../types";
import { normalizeStoredTags } from "../../tagging";
import { embeddingCache } from "./embedding-cache";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";

const settingsFile = path.join(app.getPath("userData"), "settings.json");
let cachedSettings: Settings | null = null;

const getEmbeddingSettingsSignature = (settings: Settings) => {
  if (settings.embeddings.provider === "ollama") {
    return JSON.stringify({
      provider: "ollama",
      model: settings.embeddings.models.ollama,
      baseUrl: settings.providers.ollama.baseUrl,
    });
  }

  return JSON.stringify({
    provider: "openai",
    model: settings.embeddings.models.openai,
    baseURL: settings.providers.openai.useCustomUrl
      ? settings.providers.openai.baseURL ?? null
      : null,
  });
};

const normalizePort = (rawPort: unknown, fallback: number) => {
  const parsed =
    typeof rawPort === "number"
      ? rawPort
      : typeof rawPort === "string" && rawPort.trim().length
        ? Number(rawPort)
        : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535
    ? parsed
    : fallback;
};

const readSettings = async (fallback: unknown): Promise<unknown> => {
  try {
    if (!fs.existsSync(settingsFile)) {
      return {};
    }

    return await fs.readJSON(settingsFile);
  } catch (e) {
    console.error("Error reading settings file, using fallback", e);
    return fallback;
  }
};

const normalizeSettings = (rawSettings: unknown): Settings => {
  const raw = (rawSettings ?? {}) as any;
  const merged = deepmerge(defaultSettings, raw) as Settings &
    Record<string, any>;

  return {
    core: merged.core,
    ui: merged.ui,
    tags: normalizeStoredTags(raw.tags ?? merged.tags),
    providers: {
      ollama: {
        baseUrl:
          raw.providers?.ollama?.baseUrl ??
          raw.llm?.providerConfig?.ollama?.chatModel?.baseUrl ??
          raw.embeddings?.providerConfig?.ollama?.baseUrl ??
          merged.providers.ollama.baseUrl,
      },
      openai: {
        apiKey:
          raw.providers?.openai?.apiKey ??
          raw.llm?.providerConfig?.openai?.chatModel?.apiKey ??
          raw.embeddings?.providerConfig?.openai?.apiKey ??
          merged.providers.openai.apiKey,
        useCustomUrl:
          raw.providers?.openai?.useCustomUrl ??
          raw.llm?.providerConfig?.openai?.useCustomUrl ??
          raw.embeddings?.providerConfig?.openai?.useCustomUrl ??
          merged.providers.openai.useCustomUrl,
        baseURL:
          raw.providers?.openai?.baseURL ??
          raw.llm?.providerConfig?.openai?.chatModel?.configuration?.baseURL ??
          raw.embeddings?.providerConfig?.openai?.configuration?.baseURL ??
          merged.providers.openai.baseURL,
      },
    },
    llm: {
      enabled: merged.llm.enabled,
      prompt: merged.llm.prompt,
      features: merged.llm.features,
      provider: merged.llm.provider,
      models: {
        ollama:
          raw.llm?.models?.ollama ??
          raw.llm?.providerConfig?.ollama?.chatModel?.model ??
          merged.llm.models.ollama,
        openai:
          raw.llm?.models?.openai ??
          raw.llm?.providerConfig?.openai?.chatModel?.model ??
          merged.llm.models.openai,
      },
    },
    chat: {
      enabled: merged.chat.enabled,
      provider: raw.chat?.provider ?? raw.llm?.provider ?? merged.chat.provider,
      models: {
        ollama:
          raw.chat?.models?.ollama ??
          raw.llm?.models?.ollama ??
          raw.llm?.providerConfig?.ollama?.chatModel?.model ??
          merged.chat.models.ollama,
        openai:
          raw.chat?.models?.openai ??
          raw.llm?.models?.openai ??
          raw.llm?.providerConfig?.openai?.chatModel?.model ??
          merged.chat.models.openai,
      },
    },
    embeddings: {
      enabled: merged.embeddings.enabled,
      provider: merged.embeddings.provider,
      models: {
        ollama:
          raw.embeddings?.models?.ollama ??
          raw.embeddings?.providerConfig?.ollama?.model ??
          merged.embeddings.models.ollama,
        openai:
          raw.embeddings?.models?.openai ??
          raw.embeddings?.providerConfig?.openai?.model ??
          merged.embeddings.models.openai,
      },
    },
    mcp: {
      enabled: merged.mcp.enabled,
      port: normalizePort(raw.mcp?.port, merged.mcp.port),
    },
    ffmpeg: merged.ffmpeg,
    whisper: merged.whisper,
    datahooks: merged.datahooks,
  };
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
    const normalized = normalizeSettings(await readSettings({}));
    cachedSettings = normalized;
    return normalized;
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
  const previousSettings = normalizeSettings(cachedSettings ?? settings);
  const merged = deepmerge(
    settings as Record<string, unknown>,
    partialSettings,
  );
  const mergedWithReplacedTags = Object.prototype.hasOwnProperty.call(
    partialSettings,
    "tags",
  )
    ? {
        ...merged,
        tags: normalizeStoredTags(partialSettings.tags ?? {}),
      }
    : merged;
  const resolvedSettings = normalizeSettings(mergedWithReplacedTags);
  await fs.writeJSON(settingsFile, resolvedSettings, {
    spaces: 2,
  });
  cachedSettings = resolvedSettings;
  await invalidateUiKeys(QueryKeys.Settings);
  if (previousSettings.ui.dark !== resolvedSettings.ui.dark) {
    await invalidateUiKeys(QueryKeys.Theme);
  }
  if (
    getEmbeddingSettingsSignature(previousSettings) !==
    getEmbeddingSettingsSignature(resolvedSettings)
  ) {
    embeddingCache.invalidate();
    await invalidateUiKeys(QueryKeys.History);
  }
};

export const reset = async () => {
  await fs.remove(settingsFile);
  cachedSettings = null;
  await invalidateUiKeys(QueryKeys.Settings);
  await invalidateUiKeys(QueryKeys.Theme);
};
