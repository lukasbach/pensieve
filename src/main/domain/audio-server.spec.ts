import {
  getAudioServerPort,
  getAudioServerSecret,
  setAudioServerPort,
} from "./audio-server";

describe("audio-server", () => {
  it("stores the current audio server port", () => {
    setAudioServerPort(3210);

    expect(getAudioServerPort()).toBe(3210);
  });

  it("exposes a stable hex secret", () => {
    const firstSecret = getAudioServerSecret();
    const secondSecret = getAudioServerSecret();

    expect(firstSecret).toBe(secondSecret);
    expect(firstSecret).toMatch(/^[a-f0-9]{64}$/);
  });
});
