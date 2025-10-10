import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
// import { MakerAppX } from "@electron-forge/maker-appx";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import fs from "fs-extra";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const createIcon = async (factor: number, base = 32) => {
  const source = await fs.readFile(path.join(__dirname, "./icon.svg"), "utf-8");
  const resvg = new Resvg(source, {
    background: "transparent",
    fitTo: { mode: "width", value: base * factor },
  });
  const png = resvg.render();
  await fs.writeFile(
    path.join(
      __dirname,
      "extra",
      factor === 1 ? "icon.png" : `icon@${factor}x.png`,
    ),
    png.asPng() as any,
  );
};

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: "**/*.node",
      unpackDir: "node_modules/sqlite3",
    },
    extraResource: "./extra",
    icon: "./extra/icon@8x.ico",
    ignore: [
      /^\/src/,
      /^\/docs/,
      /^\/images/,
      /^\/\.github/,
      /^\/\.idea/,
      /^\/scripts/,
      /^\/vector-store/,
      /^\/\.git/,
      /^\/\.gitignore/,
      /^\/README\.md$/,
      /^\/yarn\.lock$/,
      /^\/\.yarnrc\.yml$/,
      /^\/package-lock\.json$/,
    ],
  },
  rebuildConfig: {
    onlyModules: ["sqlite3"],
  },
  makers: [
    new MakerSquirrel({
      loadingGif: path.join(__dirname, "splash.gif"),
      setupIcon: "./extra/icon@8x.ico",
    }),
    // new MakerAppX({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
    new MakerDMG({
      icon: "./extra/icon@8x.ico",
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),

    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],

  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "lukasbach",
          name: "pensieve",
        },
        prerelease: false,
        draft: true,
        generateReleaseNotes: true,
      },
    },
  ],

  hooks: {
    generateAssets: async (config, platform, arch) => {
      const ffmpegBase = path.join(
        __dirname,
        "node_modules/ffmpeg-static-electron/bin",
      );
      const whisperBase = path.join(
        __dirname,
        "node_modules/whisper-cpp-static/bin",
      );
      const target = path.join(__dirname, "extra");
      await fs.ensureDir(target);

      // Bundle FFmpeg and Whisper binaries for Windows only
      if (platform === "win32" && arch === "x64") {
        await fs.copy(
          path.join(ffmpegBase, "win/x64/ffmpeg.exe"),
          path.join(target, "ffmpeg.exe"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-x64/main.exe"),
          path.join(target, "whisper.exe"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-x64/SDL2.dll"),
          path.join(target, "SDL2.dll"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-x64/whisper.dll"),
          path.join(target, "whisper.dll"),
        );
      }

      if (platform === "win32" && arch === "ia32") {
        await fs.copy(
          path.join(ffmpegBase, "win/ia32/ffmpeg.exe"),
          path.join(target, "ffmpeg.exe"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-Win32/main.exe"),
          path.join(target, "whisper.exe"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-Win32/SDL2.dll"),
          path.join(target, "SDL2.dll"),
        );
        await fs.copy(
          path.join(whisperBase, "whisper-bin-Win32/whisper.dll"),
          path.join(target, "whisper.dll"),
        );
      }

      // Note: For macOS and Linux, FFmpeg and Whisper will use system installations

      await createIcon(1);
      await createIcon(2);
      await createIcon(3);
      await createIcon(4);
      await createIcon(8);
      await pngToIco(path.join(__dirname, "extra/icon@8x.png")).then((buf) =>
        fs.writeFileSync(path.join(__dirname, "extra/icon@8x.ico"), buf as any),
      );
    },
  },
};

export default config;
