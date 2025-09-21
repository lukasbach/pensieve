import crypto from "crypto";

let audioServerPort: number | null = null;
const audioServerSecret = crypto.randomBytes(32).toString("hex");

export const setAudioServerPort = (port: number): void => {
  audioServerPort = port;
};

export const getAudioServerPort = (): number | null => audioServerPort;

export const getAudioServerSecret = (): string | null => audioServerSecret;
