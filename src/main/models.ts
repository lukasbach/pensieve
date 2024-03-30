// https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin?download=true
import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import { https } from "follow-redirects";
import { modelData } from "../model-data";

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
