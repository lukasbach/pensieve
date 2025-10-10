import path from "path";
import os from "os";
import fs from "fs";
import { dialog, shell } from "electron";
import log from "electron-log/main";
import {
  buildArgs,
  getExtraResourcesFolder,
  getMillisecondsFromTimeString,
} from "../../main-utils";
import { getModelPath } from "./models";
import * as ffmpeg from "./ffmpeg";
import * as runner from "./runner";
import * as postprocess from "./postprocess";
import { getSettings } from "./settings";

// Show warning dialog for missing Whisper (macOS only)
const showWhisperWarning = async () => {
  if (os.platform() !== "darwin") {
    return; // Only show on macOS
  }

  const result = await dialog.showMessageBox({
    type: "warning",
    title: "Whisper Not Found",
    message: "Whisper is required but not found on your system.",
    detail:
      "Please install whisper-cpp using one of these methods:\n\n" +
      "• Homebrew: brew install whisper-cpp\n" +
      "• Download from: https://github.com/ggerganov/whisper.cpp\n\n" +
      "Pensieve will not work properly without Whisper.",
    buttons: ["OK", "Open Whisper Website"],
    defaultId: 0,
  });

  if (result.response === 1) {
    shell.openExternal("https://github.com/ggerganov/whisper.cpp");
  }
};

// Check if Whisper is available
const checkWhisperAvailability = async (): Promise<boolean> => {
  if (os.platform() === "win32") {
    // Windows uses bundled Whisper
    return fs.existsSync(path.join(getExtraResourcesFolder(), "whisper.exe"));
  }

  // Check common Whisper paths on macOS
  const commonPaths = [
    "/opt/homebrew/bin/whisper-cpp", // Apple Silicon Homebrew
    "/usr/local/bin/whisper-cpp", // Intel Homebrew
    "whisper-cpp", // Fallback to PATH
  ];

  for (const whisperPath of commonPaths) {
    if (whisperPath === "whisper-cpp") {
      // Check if it's available in PATH
      try {
        const { execa } = await import("execa");
        await execa("whisper-cpp", ["--help"], { stdio: "pipe" });
        return true;
      } catch {
        continue;
      }
    }
    if (fs.existsSync(whisperPath)) {
      return true;
    }
  }

  return false;
};

// Use bundled Whisper for Windows, system installation for macOS/Linux
const getWhisperPath = (): string => {
  if (os.platform() === "win32") {
    return path.join(getExtraResourcesFolder(), "whisper.exe"); // Windows bundles Whisper
  }

  // Common Whisper paths on macOS
  const commonPaths = [
    "/opt/homebrew/bin/whisper-cpp", // Apple Silicon Homebrew
    "/usr/local/bin/whisper-cpp", // Intel Homebrew
    "whisper-cpp", // Fallback to PATH
  ];

  for (const whisperPath of commonPaths) {
    if (whisperPath === "whisper-cpp") {
      return whisperPath; // Let execa handle PATH resolution
    }
    if (fs.existsSync(whisperPath)) {
      return whisperPath;
    }
  }

  return "whisper-cpp"; // Final fallback
};

const whisperPath = getWhisperPath();

// Initialize Whisper check on module load
let whisperChecked = false;
const ensureWhisperAvailable = async () => {
  if (whisperChecked) {
    return;
  }
  whisperChecked = true;

  // Only check and warn on macOS (Windows bundles Whisper)
  if (os.platform() === "darwin") {
    const isAvailable = await checkWhisperAvailability();
    if (!isAvailable) {
      await showWhisperWarning();
    }
  }
};

export const processWavFile = async (
  input: string,
  output: string,
  modelId: string,
) => {
  await ensureWhisperAvailable();
  postprocess.setStep("whisper");

  // https://trac.ffmpeg.org/wiki/AudioChannelManipulation#a2monostereo
  const out = path.join(
    path.dirname(output),
    path.basename(output, path.extname(output)),
  );
  const inputTime = await ffmpeg.getDuration(input);

  const settings = (await getSettings()).whisper;
  const args = buildArgs({
    _0: input,
    t: settings.threads,
    p: settings.processors,
    mc: settings.maxContext,
    ml: settings.maxLen,
    sow: settings.splitOnWord,
    bo: settings.bestOf,
    bs: settings.beamSize,
    ac: settings.audioCtx,
    wt: settings.wordThold,
    et: settings.entropyThold,
    lpt: settings.logprobThold,
    tr: settings.translate,
    di: settings.diarize,
    nf: settings.noFallback,
    l: settings.language,
    oj: true,
    of: out,
    m: getModelPath(modelId),
  });

  log.info("Processing wav file", whisperPath, args);

  const process = runner.execute(whisperPath, args);
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
  });
  await process;
  log.info("Processed Wav File");
};
