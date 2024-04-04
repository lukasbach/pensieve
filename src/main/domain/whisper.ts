import path from "path";
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

  console.log(whisperPath, args);

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
    console.log("Whisper:", duration / inputTime);
  });
  await process;
};
