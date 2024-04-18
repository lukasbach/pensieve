import path from "path";
import fs from "fs-extra";
import * as ffmpeg from "./ffmpeg";
import * as history from "./history";
import * as whisper from "./whisper";
import * as models from "./models";
import * as runner from "./runner";
import * as llm from "./llm";
import { getRecordingTranscript, getRecordingsFolder } from "./history";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as searchIndex from "./search";
import { getSettings } from "./settings";
import { PostProcessingJob, PostProcessingStep } from "../../types";

let isRunning = false;
let processingQueue: PostProcessingJob[] = [];
const emptyProgress: Record<PostProcessingStep, null | number> = {
  modelDownload: 0,
  wav: null,
  mp3: null,
  whisper: 0,
  summary: 0,
};
const progress = { ...emptyProgress };
let lastUiUpdate = 0;
let currentStep: keyof typeof progress | "notstarted" = "notstarted";
let abortedFlag = false;

export const hasAborted = () => abortedFlag;

const updateUiProgress = () => {
  if (Date.now() < lastUiUpdate) {
    return;
  }

  if (Date.now() - lastUiUpdate > 100) {
    lastUiUpdate = Date.now();
    invalidateUiKeys(QueryKeys.PostProcessing);
    return;
  }

  setTimeout(() => {
    invalidateUiKeys(QueryKeys.PostProcessing);
  }, 100);
  lastUiUpdate = Date.now() + 100;
};

export const getCurrentItem = () => {
  return isRunning ? processingQueue[0] : null;
};

export const getProgress = (step: keyof typeof progress) => {
  return progress[step];
};

export const setProgress = (step: keyof typeof progress, value: number) => {
  progress[step] = value;
  updateUiProgress();
};

export const setStep = (step: keyof typeof progress | "notstarted") => {
  currentStep = step;
  updateUiProgress();
};

export const addToQueue = (job: PostProcessingJob) => {
  processingQueue.push(job);
  updateUiProgress();
};

const postProcessRecording = async (job: PostProcessingJob) => {
  const recordingsFolder = await getRecordingsFolder();
  const mic = path.join(recordingsFolder, job.recordingId, "mic.webm");
  const screen = path.join(recordingsFolder, job.recordingId, "screen.webm");
  const wav = path.join(recordingsFolder, job.recordingId, "whisper-input.wav");
  const mp3 = path.join(recordingsFolder, job.recordingId, "recording.mp3");

  setStep("wav");
  if (hasAborted()) return;

  if (fs.existsSync(mic) && fs.existsSync(screen)) {
    await ffmpeg.toStereoWavFile(mic, screen, wav);
    if (hasAborted()) return;
    setStep("mp3");
    await ffmpeg.toJoinedFile(mic, screen, mp3);
  } else if (fs.existsSync(mic)) {
    await ffmpeg.toWavFile(mic, wav);
    if (hasAborted()) return;
    setStep("mp3");
    await ffmpeg.toJoinedFile(mic, null, mp3);
  } else if (fs.existsSync(screen)) {
    await ffmpeg.toWavFile(screen, wav);
    if (hasAborted()) return;
    setStep("mp3");
    await ffmpeg.toJoinedFile(screen, null, mp3);
  } else {
    throw new Error("No recording found");
  }

  if (hasAborted()) return;

  await whisper.processWavFile(
    wav,
    path.join(recordingsFolder, job.recordingId, "transcript.json"),
    await models.prepareConfiguredModel(),
  );

  await fs.rm(wav);

  const settings = await getSettings();

  const transcript = await getRecordingTranscript(job.recordingId);

  if (settings.llm.enabled && transcript) {
    if (hasAborted()) return;
    setStep("summary");
    const summary = await llm.summarize(transcript);
    await history.updateRecording(job.recordingId, { summary });
  }

  if (settings.ffmpeg.removeRawRecordings) {
    if (fs.existsSync(mic)) {
      await fs.rm(mic);
    }
    if (fs.existsSync(screen)) {
      await fs.rm(screen);
    }
    await history.updateRecording(job.recordingId, { hasRawRecording: false });
  }

  await history.updateRecording(job.recordingId, {
    isPostProcessed: true,
    language: transcript?.result.language,
  });
  searchIndex.addRecordingToIndex(job.recordingId);
  updateUiProgress();
};

export const startQueue = () => {
  if (isRunning) {
    return;
  }

  abortedFlag = false;
  isRunning = true;
  const next = async () => {
    const job = processingQueue.find((job) => !job.isDone);

    if (!job) {
      isRunning = false;
      return;
    }

    try {
      await postProcessRecording(job);
      job.isDone = true;
    } catch (err) {
      if (hasAborted()) return;
      console.error("Failed to process recording", job.recordingId, err);
      job.error = err instanceof Error ? err.message : String(err);
      job.isDone = true;
    }

    processingQueue.shift();
    next();
  };

  next();
};

export const stop = () => {
  abortedFlag = true;
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

export const clearList = () => {
  processingQueue = [];
  updateUiProgress();
};

export const getProgressData = () => {
  return {
    progress,
    processingQueue,
    currentlyProcessing: isRunning ? processingQueue[0] : null,
    isRunning,
    currentStep,
  };
};
