import { Buffer } from "buffer";

export const blobToBuffer = async (blob: Blob) => {
  return new Promise<Buffer>((r) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState !== 2) {
        return;
      }
      r(Buffer.from(reader.result as ArrayBuffer));
    };
    reader.readAsArrayBuffer(blob);
  });
};

export const timeToDisplayString = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  const ms = Math.floor((time % 1) * 10);

  const hoursString = hours > 0 ? `${hours}:` : "";
  return `${hoursString}${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}.${String(ms).padStart(1, "0")}`;
};
