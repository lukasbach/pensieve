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
