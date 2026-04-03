import path from "path";
import fs from "fs-extra";
import { app, shell } from "electron";
import { RecordingData, RecordingMeta, RecordingTranscript } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as ffmpeg from "./ffmpeg";
import * as settings from "./settings";
import * as embeddings from "./embeddings";
import { getDuration } from "./ffmpeg";

const withDerivedRecordingMeta = async (
  recordingId: string,
  meta: RecordingMeta,
  embeddingConfigurationKey?: string,
) => {
  return {
    ...meta,
    hasEmbedding: await embeddings.hasCompatibleRecordingEmbedding(
      recordingId,
      embeddingConfigurationKey,
    ),
  };
};

export const getRecordingsFolder = async () => {
  return (await settings.getSettings()).core.recordingsFolder;
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
  const meta: RecordingMeta = {
    duration: Date.now() - started.getTime(),
    isPostProcessed: false,
    hasRawRecording: true,
    hasMic: !!recording.mic,
    hasScreen: !!recording.screen,
    ...recording.meta,
  };

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
  const fullMeta: RecordingMeta = {
    ...meta,
    hasMic: false,
    hasRawRecording: true,
    hasScreen: true,
    isImported: true,
    isPostProcessed: false,
    duration: await getDuration(file),
  };
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
  const recordingFolders = await fs.readdir(await getRecordingsFolder());

  // Filter out non-directories and .DS_Store files first
  const validFolders = [];
  for (const folder of recordingFolders) {
    // Skip .DS_Store and other hidden files
    if (folder.startsWith(".")) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const folderPath = path.join(await getRecordingsFolder(), folder);
    const stats = await fs.stat(folderPath);
    if (stats.isDirectory()) {
      validFolders.push(folder);
    }
  }

  const items = await Promise.all(
    validFolders.map(async (recordingFolder) => {
      const meta = (await fs.readJson(
        path.join(await getRecordingsFolder(), recordingFolder, "meta.json"),
      )) as RecordingMeta;

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
  const meta = await fs.readJson(
    path.join(await getRecordingsFolder(), recordingId, "meta.json"),
  );
  await fs.writeJson(
    path.join(await getRecordingsFolder(), recordingId, "meta.json"),
    {
      ...meta,
      ...partial,
    },
    { spaces: 2 },
  );
  const searchIndex = await import("./search");
  searchIndex.updateRecordingName(recordingId, partial.name);
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
  invalidateUiKeys(QueryKeys.History);
};
