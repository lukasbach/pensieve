import { execa } from "execa";
import path from "path";
import os from "os";
import fs from "fs";
import { dialog } from "electron";
import {
  getExtraResourcesFolder,
  getMillisecondsFromTimeString,
} from "../../main-utils";
import * as runner from "./runner";
import * as settings from "./settings";

// Check if FFmpeg is available
const checkFFmpegAvailability = async (): Promise<boolean> => {
  try {
    await execa("ffmpeg", ["-version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

// Show warning dialog for missing FFmpeg (macOS only)
const showFFmpegWarning = async () => {
  if (os.platform() !== "darwin") {
    return; // Only show on macOS
  }
  
  const result = await dialog.showMessageBox({
    type: "warning",
    title: "FFmpeg Not Found",
    message: "FFmpeg is required but not found on your system.",
    detail: "Please install FFmpeg using one of these methods:\n\n" +
            "• Homebrew: brew install ffmpeg\n" +
            "• Download from: https://ffmpeg.org/download.html\n\n" +
            "Pensieve will not work properly without FFmpeg.",
    buttons: ["OK", "Open FFmpeg Website"],
    defaultId: 0,
  });
  
  if (result.response === 1) {
    const { shell } = require("electron");
    shell.openExternal("https://ffmpeg.org/download.html");
  }
};

// Find FFmpeg executable
const findFFmpegPath = (): string => {
  if (os.platform() === "win32") {
    return path.join(getExtraResourcesFolder(), "ffmpeg.exe"); // Windows still bundles FFmpeg
  }
  
  // Common FFmpeg paths on macOS
  const commonPaths = [
    "/opt/homebrew/bin/ffmpeg", // Apple Silicon Homebrew
    "/usr/local/bin/ffmpeg",    // Intel Homebrew
    "/usr/bin/ffmpeg",          // System installation
    "ffmpeg"                    // Fallback to PATH
  ];
  
  for (const ffmpegPath of commonPaths) {
    if (ffmpegPath === "ffmpeg") {
      return ffmpegPath; // Let execa handle PATH resolution
    }
    if (fs.existsSync(ffmpegPath)) {
      return ffmpegPath;
    }
  }
  
  return "ffmpeg"; // Final fallback
};

const ffmpegPath = findFFmpegPath();

// Initialize FFmpeg check on module load
let ffmpegChecked = false;
const ensureFFmpegAvailable = async () => {
  if (ffmpegChecked) {
    return;
  }
  ffmpegChecked = true;
  
  // Only check and warn on macOS (Windows bundles FFmpeg)
  if (os.platform() === "darwin") {
    const isAvailable = await checkFFmpegAvailability();
    if (!isAvailable) {
      await showFFmpegWarning();
    }
  }
};

export const simpleTranscode = async (input: string, output: string) => {
  await ensureFFmpegAvailable();
  await execa(ffmpegPath, ["-i", input, "-y", output], {
    stdio: "inherit",
  });
};

export const toWavFile = async (input: string, output: string) => {
  await ensureFFmpegAvailable();
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
  await ensureFFmpegAvailable();
  // https://trac.ffmpeg.org/wiki/AudioChannelManipulation#a2monostereo
  await runner.execute(
    ffmpegPath,
    [
      // "-i",      input1,      "-i",      input2,      "-filter_complex",      "[0:a][1:a]join=inputs=2:channel_layout=stereo[a]",      "-map",      "[a]",      "-y",      "-ar",      "16000",      output,

      "-i",
      input1,
      "-i",
      input2,
      "-filter_complex",
      (await settings.getSettings()).ffmpeg.stereoWavFilter, // afftdn=nf=-20
      "-map",
      "[a]",
      "-ar",
      "16000",
      "-y",
      output,
    ],
    { stdio: "inherit" },
  );
};

export const toJoinedFile = async (
  input1: string | null,
  input2: string | null,
  output: string,
) => {
  await ensureFFmpegAvailable();
  if (!input1 && !input2) {
    throw new Error("No input files");
  }

  if (input1 && input2) {
    await runner.execute(
      ffmpegPath,
      [
        "-i",
        input1,
        "-i",
        input2,
        "-filter_complex",
        (await settings.getSettings()).ffmpeg.mp3Filter,
        "-y",
        output,
      ],
      { stdio: "inherit" },
    );
  } else {
    await execa(ffmpegPath, ["-i", (input1 ?? input2)!, "-y", output], {
      stdio: "inherit",
    });
  }
};

export const getDuration = async (input: string) => {
  await ensureFFmpegAvailable();
  const { stdout, stderr } = await runner.execute(
    ffmpegPath,
    ["-i", input, "-f", "null", "-"],
    {
      stdout: "pipe",
    },
  );
  const match = (stderr || stdout).match(
    /duration\s*:?\s(\d{2}:\d{2}:\d{2}.\d{2})/i,
  );
  const time = match?.[1];
  if (!time) {
    return 0;
  }
  return getMillisecondsFromTimeString(time!);
};
