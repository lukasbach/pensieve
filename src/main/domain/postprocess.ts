import path from "path";
import fs from "fs-extra";
import log from "electron-log/main";
import * as ffmpeg from "./ffmpeg";
import * as history from "./history";
import * as whisper from "./whisper";
import * as models from "./models";
import * as runner from "./runner";
import * as llm from "./llm";
import * as datahooks from "./datahooks";
import { getRecordingTranscript, getRecordingsFolder } from "./history";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as searchIndex from "./search";
import * as vectorSearch from "./vector-search";
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
  datahooks: null,
  vectorSearch: 0,
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

const getFilePaths = async (job: PostProcessingJob) => {
  const recordingsFolder = await getRecordingsFolder();
  const mic = path.join(recordingsFolder, job.recordingId, "mic.webm");
  const screen = path.join(recordingsFolder, job.recordingId, "screen.webm");
  const wav = path.join(recordingsFolder, job.recordingId, "whisper-input.wav");
  const mp3 = path.join(recordingsFolder, job.recordingId, "recording.mp3");
  return { mic, screen, wav, mp3, recordingsFolder };
};

const hasStep = (job: PostProcessingJob, step: PostProcessingStep) => {
  return !job.steps || job.steps?.includes(step);
};

const doWavStep = async (job: PostProcessingJob) => {
  if (hasAborted() || !hasStep(job, "wav")) return;
  setStep("wav");
  const { mic, screen, wav } = await getFilePaths(job);

  // Skip if WAV already exists
  if (await fs.pathExists(wav)) {
    log.info(`WAV file already exists, skipping creation: ${wav}`);
    return;
  }

  if (fs.existsSync(mic) && fs.existsSync(screen)) {
    await ffmpeg.toStereoWavFile(mic, screen, wav);
  } else if (fs.existsSync(mic)) {
    await ffmpeg.toWavFile(mic, wav);
  } else if (fs.existsSync(screen)) {
    await ffmpeg.toWavFile(screen, wav);
  } else {
    // No recording files, skipping step
  }
};

const doMp3Step = async (job: PostProcessingJob) => {
  if (hasAborted() || !hasStep(job, "mp3")) return;
  setStep("mp3");
  const { mic, screen, mp3 } = await getFilePaths(job);

  // Skip if MP3 already exists (don't recreate if we're using it as fallback)
  if (await fs.pathExists(mp3)) {
    log.info(`MP3 file already exists, skipping creation: ${mp3}`);
    return;
  }

  if (fs.existsSync(mic) && fs.existsSync(screen)) {
    await ffmpeg.toJoinedFile(mic, screen, mp3);
  } else if (fs.existsSync(mic)) {
    await ffmpeg.toJoinedFile(mic, null, mp3);
  } else if (fs.existsSync(screen)) {
    await ffmpeg.toJoinedFile(screen, null, mp3);
  } else {
    // No recording files, skipping step
  }
};

const doWhisperStep = async (job: PostProcessingJob) => {
  if (hasAborted() || !hasStep(job, "whisper")) return;
  const { wav, mp3, recordingsFolder } = await getFilePaths(job);

  // If WAV file doesn't exist (e.g., was removed), fallback to MP3
  const audioInput = (await fs.pathExists(wav)) ? wav : mp3;
  if (!(await fs.pathExists(audioInput))) {
    log.error(
      `No audio file found for processing. Expected WAV: ${wav} or MP3: ${mp3}`,
    );
    throw new Error(
      `No audio file found for processing recording: ${job.recordingId}`,
    );
  }

  const model = await models.prepareConfiguredModel();

  await whisper.processWavFile(
    audioInput,
    path.join(recordingsFolder, job.recordingId, "transcript.json"),
    model,
  );

  // Only remove WAV file if it exists and we used it (not if we used MP3 fallback)
  if ((await fs.pathExists(wav)) && audioInput === wav) {
    await fs.rm(wav);
  }
};

const doSummaryStep = async (job: PostProcessingJob) => {
  const settings = await getSettings();
  const transcript = await getRecordingTranscript(job.recordingId);

  if (
    hasAborted() ||
    !hasStep(job, "summary") ||
    !settings.llm.enabled ||
    !transcript
  )
    return;
  setStep("summary");

  const summary = await llm.summarize(transcript);
  await history.updateRecording(job.recordingId, { summary });
};

const doDataHooksStep = async (job: PostProcessingJob) => {
  const settings = await getSettings();

  if (hasAborted() || !hasStep(job, "datahooks") || !settings.datahooks.enabled)
    return;
  setStep("datahooks");
  await datahooks.runDatahooks(job);
};

const doVectorSearchStep = async (job: PostProcessingJob) => {
  if (hasAborted() || !hasStep(job, "vectorSearch")) return;
  setStep("vectorSearch");
  setProgress("vectorSearch", 0);

  try {
    await vectorSearch.addTranscriptToVectorStore(
      job.recordingId,
      (progress) => {
        setProgress("vectorSearch", progress);
      },
    );
  } catch (error) {
    log.error("Vector search indexing failed:", error);
    // Don't fail the entire post-processing if vector indexing fails
  }
};

const postProcessRecording = async (job: PostProcessingJob) => {
  await doWavStep(job);
  await doMp3Step(job);
  await doWhisperStep(job);
  await doSummaryStep(job);
  await doDataHooksStep(job);
  await doVectorSearchStep(job);

  const settings = await getSettings();

  const { mic, screen } = await getFilePaths(job);
  if (settings.ffmpeg.removeRawRecordings) {
    if (fs.existsSync(mic)) {
      await fs.rm(mic);
    }
    if (fs.existsSync(screen)) {
      await fs.rm(screen);
    }
    await history.updateRecording(job.recordingId, { hasRawRecording: false });
  }

  const transcript = await getRecordingTranscript(job.recordingId);
  await history.updateRecording(job.recordingId, {
    isPostProcessed: true,
    language: transcript?.result.language,
  });
  searchIndex.addRecordingToIndex(job.recordingId);
  updateUiProgress();
};

const resetProgress = () => {
  progress.modelDownload = 0;
  progress.wav = 0;
  progress.mp3 = 0;
  progress.whisper = 0;
  progress.summary = 0;
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
      job.isRunning = true;
      resetProgress();
      await postProcessRecording(job);
      job.isDone = true;
      job.isRunning = false;
    } catch (err) {
      if (hasAborted()) return;
      log.error("Failed to process recording", job.recordingId, err);
      job.error = err instanceof Error ? err.message : String(err);
      job.isDone = true;
      job.isRunning = false;
    }
    next();
  };

  next();
};

export const stop = () => {
  abortedFlag = true;
  runner.abortAllExecutions();
  isRunning = false;
  resetProgress();
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
    isRunning,
    currentStep,
  };
};
