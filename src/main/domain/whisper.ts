import { execa } from "execa";
import path from "path";
import { getExtraResourcesFolder } from "../../main-utils";
import { getModelPath } from "./models";

const whisperPath = path.join(getExtraResourcesFolder(), "whisper.exe");

export const processWavFile = async (
  input: string,
  output: string,
  modelId: string,
) => {
  // https://trac.ffmpeg.org/wiki/AudioChannelManipulation#a2monostereo
  const out = path.join(
    path.dirname(output),
    path.basename(output, path.extname(output)),
  );
  await execa(
    whisperPath,
    [
      input,
      "-di",
      "-oj",
      "-l",
      "auto",
      "-of",
      out,
      "-m",
      getModelPath(modelId),
    ],
    {
      stdio: "inherit",
    },
  );
};
