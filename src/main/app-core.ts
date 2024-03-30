import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { RecordingData } from "../types";

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
  }

  public getRecordingsFolder() {
    return path.join(app.getPath("userData"), "recordings");
  }
}
