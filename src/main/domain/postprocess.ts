import path from "path";
import fs from "fs-extra";
import * as ffmpeg from "./ffmpeg";
import * as whisper from "./whisper";
import * as models from "./models";
import * as runner from "./runner";
import { getRecordingsFolder } from "./history";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";

let isRunning = false;
const processingQueue: string[] = [];
const emptyProgress = {
  modelDownload: 0,
  wav: null,
  mp3: null,
  whisper: 0,
  summary: null,
} as Record<
  "modelDownload" | "wav" | "mp3" | "whisper" | "summary",
  null | number
>;
const progress = { ...emptyProgress };
let lastUiUpdate = 0;
let currentStep: keyof typeof progress | "notstarted" = "notstarted";

const updateUiProgress = () => {
  if (lastUiUpdate + 100 < Date.now()) {
    lastUiUpdate = Date.now();
    invalidateUiKeys(QueryKeys.PostProcessing);
  } else {
    setTimeout(updateUiProgress, 100);
  }
};

export const getCurrentItem = () => {
  return isRunning ? processingQueue[0] : null;
};

export const setProgress = (step: keyof typeof progress, value: number) => {
  progress[step] = value;
  updateUiProgress();
};

export const setStep = (step: keyof typeof progress | "notstarted") => {
  currentStep = step;
};

export const addToQueue = (recordingId: string) => {
  processingQueue.push(recordingId);
  updateUiProgress();
};

export const postProcessRecording = async (id: string) => {
  const mic = path.join(getRecordingsFolder(), id, "mic.webm");
  const screen = path.join(getRecordingsFolder(), id, "screen.webm");
  const wav = path.join(getRecordingsFolder(), id, "whisper-input.wav");
  const mp3 = path.join(getRecordingsFolder(), id, "recording.mp3");

  setStep("wav");

  if (fs.existsSync(mic) && fs.existsSync(screen)) {
    await ffmpeg.toStereoWavFile(mic, screen, wav);
    setStep("mp3");
    await ffmpeg.toJoinedFile(mic, screen, mp3);
  } else if (fs.existsSync(mic)) {
    await ffmpeg.toWavFile(mic, wav);
    setStep("mp3");
    await ffmpeg.toJoinedFile(mic, null, mp3);
  } else if (fs.existsSync(screen)) {
    await ffmpeg.toWavFile(screen, wav);
    setStep("mp3");
    await ffmpeg.toJoinedFile(screen, null, mp3);
  } else {
    throw new Error("No recording found");
  }

  await whisper.processWavFile(
    wav,
    path.join(getRecordingsFolder(), id, "transcript.json"),
    await models.prepareConfiguredModel(),
  );

  await fs.rm(wav);
  updateUiProgress();
};

export const startQueue = () => {
  if (isRunning) {
    return;
  }

  isRunning = true;
  const next = async () => {
    if (processingQueue.length === 0) {
      isRunning = false;
      return;
    }

    const id = processingQueue[0];
    try {
      await postProcessRecording(id);
    } catch (err) {
      // TODO
      console.error("Failed to process recording", id, err);
    }

    processingQueue.shift();
    next();
  };

  next();
};

export const stop = () => {
  runner.abortAllExecutions();
  isRunning = false;
  progress.modelDownload = 0;
  progress.wav = 0;
  progress.mp3 = 0;
  progress.whisper = 0;
  progress.summary = 0;
  setStep("notstarted");
  updateUiProgress();
};

export const getProgressData = () => {
  return {
    progress,
    processingQueue,
    currentlyProcessing: isRunning ? processingQueue[0] : null,
    isRunning,
  };
};
