// https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin?download=true
import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import { https } from "follow-redirects";
import { modelData } from "../../model-data";
import { getSettings } from "./settings";
import * as postprocess from "./postprocess";

const modelFolder = path.join(app.getPath("userData"), "models");

export const validateModelUrl = (url: string) => {
  return url.startsWith("https://huggingface.co/ggerganov/whisper.cpp");
};

export const downloadModel = async (url: string, modelFile: string) => {
  if (!validateModelUrl(url)) {
    throw new Error("Invalid model URL");
  }

  await fs.ensureDir(modelFolder);
  return new Promise<void>((resolve, reject) => {
    const req = https.get(url, (res) => {
      const file = fs.createWriteStream(path.join(modelFolder, modelFile));
      res.pipe(file);
      let downloaded = 0;
      const length = parseInt(res.headers["content-length"] || "0", 10);
      res.on("data", (chunk) => {
        downloaded += chunk.length;
        postprocess.setProgress("modelDownload", downloaded / length);
        console.log("Downloading model", downloaded / length);
      });
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });
    req.on("error", (err) => {
      fs.unlink(path.join(modelFolder, modelFile), () => {
        reject(err);
      });
    });
  });
};

export const getModels = async () => {
  await fs.ensureDir(modelFolder);
  return fs.readdir(modelFolder);
};

export const hasModel = async (modelFile: string) => {
  return fs.pathExists(path.join(modelFolder, modelFile));
};

export const getModelPath = (modelId: string) => {
  return path.join(modelFolder, modelData[modelId].fileName);
};

export const prepareConfiguredModel = async () => {
  const { model } = (await getSettings()).whisper;
  if (!(await hasModel(model))) {
    postprocess.setStep("modelDownload");
    await downloadModel(modelData[model].url, modelData[model].fileName);
  }
  postprocess.setProgress("modelDownload", 1);
  return model;
};
