import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { RecordingData, RecordingMeta } from "../types";

export class AppCore {
  private constructor() {}

  static async start() {
    await fs.ensureDir(path.join(app.getPath("userData"), "recordings"));
    return new AppCore();
  }

  public async saveRecording(recording: RecordingData) {
    const date = new Date();
    const folder = path.join(
      this.getRecordingsFolder(),
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
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
    await fs.writeJSON(path.join(folder, "meta.json"), recording.meta, {
      spaces: 2,
    });
  }

  public async listRecordings() {
    const recordingFolders = await fs.readdir(this.getRecordingsFolder());
    const items = await Promise.all(
      recordingFolders.map(
        async (recordingFolder) =>
          [
            recordingFolder,
            (await fs.readJson(
              path.join(
                this.getRecordingsFolder(),
                recordingFolder,
                "meta.json",
              ),
            )) as RecordingMeta,
          ] as const,
      ),
    );
    return items.reduce(
      (acc, [folder, meta]) => {
        acc[folder] = meta;
        return acc;
      },
      {} as Record<string, RecordingMeta>,
    );
  }

  public postProcessRecording(id: string) {}

  public getExtraResourcesFolder() {
    return process.env.NODE_ENV === "development"
      ? path.join(__dirname, "../../extra")
      : process.resourcesPath;
  }

  public getRecordingsFolder() {
    return path.join(app.getPath("userData"), "recordings");
  }
}
