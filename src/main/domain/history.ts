import path from "path";
import fs from "fs-extra";
import { app, shell } from "electron";
import { RecordingData, RecordingMeta, RecordingTranscript } from "../../types";
import {
  getTagKey,
  normalizeSelectedTags,
  retainStoredTags,
} from "../../tagging";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as ffmpeg from "./ffmpeg";
import * as settings from "./settings";
import * as embeddings from "./embeddings";
import { getDuration } from "./ffmpeg";

const normalizeRecordingMeta = (meta: RecordingMeta): RecordingMeta => {
  const tags = normalizeSelectedTags(meta.tags);

  return {
    ...meta,
    tags: tags.length > 0 ? tags : undefined,
  };
};

const getVisibleRecordingFolders = async () => {
  const {
    core: { recordingsFolder },
  } = await settings.getSettings();
  const recordingFolders = await fs.readdir(recordingsFolder);
  const validFolders = (
    await Promise.all(
      recordingFolders.map(async (folder) => {
        if (folder.startsWith(".")) {
          return null;
        }

        const stats = await fs.stat(path.join(recordingsFolder, folder));
        return stats.isDirectory() ? folder : null;
      }),
    )
  ).flatMap((folder) => (folder ? [folder] : []));

  return {
    recordingsFolder,
    validFolders,
  };
};

const listStoredRecordingMetas = async () => {
  const { recordingsFolder, validFolders } = await getVisibleRecordingFolders();

  return Promise.all(
    validFolders.map(async (recordingFolder) => {
      const meta = (await fs.readJson(
        path.join(recordingsFolder, recordingFolder, "meta.json"),
      )) as RecordingMeta;

      return [recordingFolder, normalizeRecordingMeta(meta)] as const;
    }),
  );
};

const hasRemovedTags = (before?: string[], after?: string[]) => {
  const nextTags = new Set(normalizeSelectedTags(after).map(getTagKey));

  return normalizeSelectedTags(before).some(
    (tag) => !nextTags.has(getTagKey(tag)),
  );
};

const syncTagCatalogWithRecordings = async () => {
  const currentSettings = await settings.getSettings();

  if (Object.keys(currentSettings.tags).length === 0) {
    return;
  }

  const referencedTags = (await listStoredRecordingMetas()).flatMap(
    ([, meta]) => meta.tags ?? [],
  );
  const nextTags = retainStoredTags(currentSettings.tags, referencedTags);

  if (JSON.stringify(nextTags) !== JSON.stringify(currentSettings.tags)) {
    await settings.saveSettings({ tags: nextTags });
  }
};

export const getRecordingsFolder = async () => {
  return (await settings.getSettings()).core.recordingsFolder;
};

const withDerivedRecordingMeta = async (
  recordingId: string,
  meta: RecordingMeta,
  embeddingConfigurationKey?: string,
) => {
  const recordingFolder = path.join(await getRecordingsFolder(), recordingId);
  const fileSizeBytes = (
    await Promise.all(
      (await fs.readdir(recordingFolder)).map(async (fileName) => {
        const stats = await fs.stat(path.join(recordingFolder, fileName));
        return stats.isDirectory() ? 0 : stats.size;
      }),
    )
  ).reduce((total, size) => total + size, 0);

  return {
    ...normalizeRecordingMeta(meta),
    fileSizeBytes,
    hasEmbedding: await embeddings.hasCompatibleRecordingEmbedding(
      recordingId,
      embeddingConfigurationKey,
    ),
  };
};

export const init = async () => {
  await fs.ensureDir(await getRecordingsFolder());
};

export const getUnassociatedImagesFolder = () => {
  return path.join(app.getPath("userData"), "unassociated-images");
};

export const storeUnassociatedScreenshot = async (
  fileName: string,
  data: Uint8Array,
) => {
  if (!fileName.endsWith(".png")) {
    throw new Error("Only PNG files are supported");
  }

  await fs.outputFile(path.join(getUnassociatedImagesFolder(), fileName), data);
};

export const saveRecording = async (recording: RecordingData) => {
  const started = new Date(recording.meta.started);
  const meta = normalizeRecordingMeta({
    duration: Date.now() - started.getTime(),
    isPostProcessed: false,
    hasRawRecording: true,
    hasMic: !!recording.mic,
    hasScreen: !!recording.screen,
    ...recording.meta,
  });

  const recordingId = `${started.getFullYear()}-${started.getMonth() + 1}-${started.getDate()}_${started.getHours()}-${started.getMinutes()}-${started.getSeconds()}`;
  const folder = path.join(await getRecordingsFolder(), recordingId);
  await fs.ensureDir(folder);
  if (recording.mic) {
    await fs.writeFile(
      path.join(folder, "mic.webm"),
      Buffer.from(recording.mic),
    );
  }
  if (recording.screen) {
    await fs.writeFile(
      path.join(folder, "screen.webm"),
      Buffer.from(recording.screen),
    );
  }
  await fs.writeJSON(path.join(folder, "meta.json"), meta, {
    spaces: 2,
  });

  for (const screenshot of Object.values(recording.meta.screenshots ?? {})) {
    await fs.move(
      path.join(getUnassociatedImagesFolder(), screenshot),
      path.join(folder, screenshot),
    );
  }

  const searchIndex = await import("./search");
  searchIndex.updateRecordingName(recordingId, recording.meta.name);
  invalidateUiKeys(QueryKeys.History);

  return recordingId;
};

export const importRecording = async (file: string, meta: RecordingMeta) => {
  const date = new Date(meta.started);
  const recordingId = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  const folder = path.join(await getRecordingsFolder(), recordingId);
  await fs.ensureDir(folder);
  await ffmpeg.simpleTranscode(file, path.join(folder, "screen.webm"));
  const fullMeta = normalizeRecordingMeta({
    ...meta,
    hasMic: false,
    hasRawRecording: true,
    hasScreen: true,
    isImported: true,
    isPostProcessed: false,
    duration: await getDuration(file),
  });
  await fs.writeJSON(path.join(folder, "meta.json"), fullMeta, {
    spaces: 2,
  });
  const searchIndex = await import("./search");
  searchIndex.updateRecordingName(recordingId, fullMeta.name);
  invalidateUiKeys(QueryKeys.History);

  return recordingId;
};

export const listRecordings = async () => {
  const embeddingConfigurationKey =
    await embeddings.getCurrentEmbeddingConfigurationKey();
  const items = await Promise.all(
    (await listStoredRecordingMetas()).map(async ([recordingFolder, meta]) => {
      return [
        recordingFolder,
        await withDerivedRecordingMeta(
          recordingFolder,
          meta,
          embeddingConfigurationKey,
        ),
      ] as const;
    }),
  );
  return items.reverse().reduce(
    (acc, [folder, meta]) => {
      acc[folder] = meta;
      return acc;
    },
    {} as Record<string, RecordingMeta>,
  );
};

export const getRecordingMeta = async (
  recordingId: string,
): Promise<RecordingMeta> => {
  const meta = (await fs.readJson(
    path.join(await getRecordingsFolder(), recordingId, "meta.json"),
  )) as RecordingMeta;
  return withDerivedRecordingMeta(
    recordingId,
    meta,
    await embeddings.getCurrentEmbeddingConfigurationKey(),
  );
};

export const getRecordingTranscript = async (
  recordingId: string,
): Promise<RecordingTranscript | null> => {
  const file = path.join(
    await getRecordingsFolder(),
    recordingId,
    "transcript.json",
  );
  return fs.existsSync(file) ? fs.readJson(file) : null;
};

export const getRecordingAudioFile = async (id: string) => {
  const mp3 = path.join(await getRecordingsFolder(), id, "recording.mp3");
  return fs.existsSync(mp3) ? `file://${mp3}` : null;
};

export const updateRecording = async (
  recordingId: string,
  partial: Partial<RecordingMeta>,
) => {
  const meta = (await fs.readJson(
    path.join(await getRecordingsFolder(), recordingId, "meta.json"),
  )) as RecordingMeta;
  const previousMeta = normalizeRecordingMeta(meta);
  const nextMeta = normalizeRecordingMeta({
    ...previousMeta,
    ...partial,
  });
  await fs.writeJson(
    path.join(await getRecordingsFolder(), recordingId, "meta.json"),
    nextMeta,
    { spaces: 2 },
  );
  const searchIndex = await import("./search");
  searchIndex.updateRecordingName(recordingId, partial.name);
  if (hasRemovedTags(previousMeta.tags, nextMeta.tags)) {
    await syncTagCatalogWithRecordings();
  }
  invalidateUiKeys(QueryKeys.History, recordingId);
  invalidateUiKeys(QueryKeys.History);
};

export const openRecordingFolder = async (recordingId: string) => {
  const folder = path.join(await getRecordingsFolder(), recordingId);
  await shell.openPath(folder);
};

export const removeRecording = async (recordingId: string) => {
  await fs.remove(path.join(await getRecordingsFolder(), recordingId));
  const searchIndex = await import("./search");
  searchIndex.removeRecordingFromIndex(recordingId);
  embeddings.invalidateSemanticSearchStore();
  await syncTagCatalogWithRecordings();
  invalidateUiKeys(QueryKeys.History);
};
