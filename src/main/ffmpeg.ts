import { execa } from "execa";
import path from "path";
import { getExtraResourcesFolder } from "../main-utils";

const ffmpegPath = path.join(getExtraResourcesFolder(), "ffmpeg.exe");

export const toWavFile = async (input: string, output: string) => {
  await execa(
    ffmpegPath,
    ["-i", input, "-ac", "2", "-y", "-ar", "16000", output],
    {
      stdio: "inherit",
    },
  );
};

export const toStereoWavFile = async (
  input1: string,
  input2: string,
  output: string,
) => {
  // https://trac.ffmpeg.org/wiki/AudioChannelManipulation#a2monostereo
  await execa(
    ffmpegPath,
    [
      "-i",
      input1,
      "-i",
      input2,
      "-filter_complex",
      "amerge",
      "-ac",
      "2",
      "-y",
      "-ar",
      "16000",
      output,
    ],
    { stdio: "inherit" },
  );
};
