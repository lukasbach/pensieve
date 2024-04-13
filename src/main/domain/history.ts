import path from "path";
import fs from "fs-extra";
import { app, shell } from "electron";
import { RecordingData, RecordingMeta, RecordingTranscript } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as searchIndex from "./search";
import * as ffmpeg from "./ffmpeg";
import * as settings from "./settings";
import * as postprocess from "./postprocess";
import { getDuration } from "./ffmpeg";

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

  const folder = path.join(
    await getRecordingsFolder(),
    `${started.getFullYear()}-${started.getMonth() + 1}-${started.getDate()}_${started.getHours()}-${started.getMinutes()}-${started.getSeconds()}`,
  );
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

  searchIndex.updateRecordingName(folder, recording.meta.name);
  invalidateUiKeys(QueryKeys.History);

  if ((await settings.getSettings()).ffmpeg.autoTriggerPostProcess) {
    postprocess.addToQueue(folder);
    postprocess.startQueue();
  }
};

export const importRecording = async (file: string, meta: RecordingMeta) => {
  const date = new Date(meta.started);
  const folder = path.join(
    await getRecordingsFolder(),
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
  );
  await fs.ensureDir(folder);
  await ffmpeg.simpleTranscode(file, path.join(folder, "screen.webm"));
  const fullMeta: RecordingMeta = {
    ...meta,
    isImported: true,
    duration: await getDuration(file),
  };
  await fs.writeJSON(path.join(folder, "meta.json"), fullMeta, {
    spaces: 2,
  });
  searchIndex.updateRecordingName(folder, fullMeta.name);
  invalidateUiKeys(QueryKeys.History);

  if ((await settings.getSettings()).ffmpeg.autoTriggerPostProcess) {
    postprocess.addToQueue(folder);
    postprocess.startQueue();
  }
};

export const listRecordings = async () => {
  const recordingFolders = await fs.readdir(await getRecordingsFolder());
  const items = await Promise.all(
    recordingFolders.map(
      async (recordingFolder) =>
        [
          recordingFolder,
          (await fs.readJson(
            path.join(
              await getRecordingsFolder(),
              recordingFolder,
              "meta.json",
            ),
          )) as RecordingMeta,
        ] as const,
    ),
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
): Promise<RecordingMeta> =>
  fs.readJson(path.join(await getRecordingsFolder(), recordingId, "meta.json"));

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
  );
  searchIndex.updateRecordingName(recordingId, partial.name);
  invalidateUiKeys(QueryKeys.History, recordingId);
  invalidateUiKeys(QueryKeys.History);
};

export const openRecordingFolder = async (recordingId: string) => {
  const folder = path.join(await getRecordingsFolder(), recordingId);
  await shell.openPath(folder);
};

export const removeRecording = async (recordingId: string) => {
  const trash = await import("trash");
  await trash.default(path.join(await getRecordingsFolder(), recordingId));
  searchIndex.removeRecordingFromIndex(recordingId);
  invalidateUiKeys(QueryKeys.History);
};
