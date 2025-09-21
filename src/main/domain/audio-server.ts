let audioServerPort: number | null = null;

export const setAudioServerPort = (port: number): void => {
  audioServerPort = port;
};

export const getAudioServerPort = (): number | null => audioServerPort;
