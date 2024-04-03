import path from "path";
import {
  getExtraResourcesFolder,
  getMillisecondsFromTimeString,
} from "../../main-utils";
import { getModelPath } from "./models";
import * as ffmpeg from "./ffmpeg";
import * as runner from "./runner";
import * as postprocess from "./postprocess";

const whisperPath = path.join(getExtraResourcesFolder(), "whisper.exe");

export const processWavFile = async (
  input: string,
  output: string,
  modelId: string,
) => {
  postprocess.setStep("whisper");

  // https://trac.ffmpeg.org/wiki/AudioChannelManipulation#a2monostereo
  const out = path.join(
    path.dirname(output),
    path.basename(output, path.extname(output)),
  );
  const inputTime = await ffmpeg.getDuration(input);

  const process = runner.execute(whisperPath, [
    input,
    "-di",
    "-oj",
    "-l",
    "auto",
    "-of",
    out,
    "-m",
    getModelPath(modelId),
  ]);
  process.stdout?.on("data", (data) => {
    const line = data.toString();
    const match = line.matchAll(
      /\[\d{2}:\d{2}:\d{2}\.\d{3} --> (\d{2}:\d{2}:\d{2}\.\d{3})\]/g,
    );
    const time = Array.from(match).map((m: any) => m[1]);
    const duration = getMillisecondsFromTimeString(time[0]);
    if (duration > 0) {
      postprocess.setProgress("whisper", duration / inputTime);
    }
    console.log("Whisper:", duration / inputTime);
  });
  await process;
};
