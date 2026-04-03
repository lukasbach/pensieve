import path from "path";
import {
  buildArgs,
  getExtraResourcesFolder,
  getIconPath,
  getMillisecondsFromTimeString,
} from "./main-utils";

describe("main-utils", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses ffmpeg-style timestamps into milliseconds", () => {
    expect(getMillisecondsFromTimeString("")).toBe(0);
    expect(getMillisecondsFromTimeString("00:00:05.120")).toBe(5120);
    expect(getMillisecondsFromTimeString("01:02:03.004")).toBe(3723004);
  });

  it("builds cli arguments from a flag map", () => {
    expect(
      buildArgs({
        input: "recording.wav",
        verbose: true,
        overwrite: null,
        disabled: false,
        _0: "ffmpeg",
        threads: 4,
      }),
    ).toEqual([
      "-input",
      "recording.wav",
      "-verbose",
      "-overwrite",
      "ffmpeg",
      "-threads",
      "4",
    ]);
  });

  it("uses the extra folder from the packaged resources directory", () => {
    vi.stubEnv("NODE_ENV", "production");
    Object.defineProperty(process, "resourcesPath", {
      value: "C:\\Pensieve\\resources",
      configurable: true,
    });

    expect(getExtraResourcesFolder()).toBe(
      path.join("C:\\Pensieve\\resources", "extra"),
    );
    expect(getIconPath()).toBe(
      path.join("C:\\Pensieve\\resources", "extra", "icon.png"),
    );
  });
});
