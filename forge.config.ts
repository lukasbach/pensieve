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
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

const createIcns = async () => {
  const extraDir = path.join(__dirname, "extra");
  const iconsetDir = path.join(extraDir, "icon.iconset");
  await fs.ensureDir(iconsetDir);

  // macOS requires specific icon sizes in .iconset format
  // Format: icon_{size}x{size}.png and icon_{size}x{size}@2x.png
  const sizes = [
    { size: 16, filename: "icon_16x16.png" },
    { size: 32, filename: "icon_16x16@2x.png" }, // 32x32 for @2x
    { size: 32, filename: "icon_32x32.png" },
    { size: 64, filename: "icon_32x32@2x.png" }, // 64x64 for @2x
    { size: 128, filename: "icon_128x128.png" },
    { size: 256, filename: "icon_128x128@2x.png" }, // 256x256 for @2x
    { size: 256, filename: "icon_256x256.png" },
    { size: 512, filename: "icon_256x256@2x.png" }, // 512x512 for @2x
    { size: 512, filename: "icon_512x512.png" },
    { size: 1024, filename: "icon_512x512@2x.png" }, // 1024x1024 for @2x
  ];

  // Generate all required icon sizes
  for (const { size, filename } of sizes) {
    const source = await fs.readFile(
      path.join(__dirname, "./icon.svg"),
      "utf-8",
    );
    const resvg = new Resvg(source, {
      background: "transparent",
      fitTo: { mode: "width", value: size },
    });
    const png = resvg.render();
    await fs.writeFile(path.join(iconsetDir, filename), png.asPng() as any);
  }

  // Convert .iconset to .icns using macOS iconutil
  const icnsPath = path.join(extraDir, "icon.icns");
  await execAsync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);

  // Clean up the .iconset directory
  await fs.remove(iconsetDir);
};

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: "*.{node,dll,exe}",
    },
    extraResource: "./extra",
    // Electron packager will automatically use .icns for macOS, .ico for Windows
    // We generate both formats in generateAssets hook
    icon: "./extra/icon",
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
    onlyModules: [],
  },
  makers: [
    new MakerSquirrel({
      loadingGif: path.join(__dirname, "splash.gif"),
      setupIcon: "./extra/icon.ico",
    }),
    // new MakerAppX({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
    new MakerDMG({
      icon: "./extra/icon.icns",
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
          owner:
            process.env.GITHUB_REPOSITORY_OWNER ||
            process.env.GITHUB_REPOSITORY?.split("/")[0] ||
            "lukasbach",
          name: process.env.GITHUB_REPOSITORY?.split("/")[1] || "pensieve",
        },
        prerelease: false,
        draft: true,
        generateReleaseNotes: true,
      },
    },
  ],

  hooks: {
    packageAfterPrune: async (config, buildPath) => {
      // Remove problematic symlinks in nested node_modules/.bin directories that break ASAR
      // These symlinks point outside the package and cause ASAR packaging to fail.
      // .bin directories are only needed for development (npm/yarn scripts), not at runtime.
      const removeBinSymlinks = async (dir: string) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              // Recursively check all directories
              await removeBinSymlinks(fullPath);

              // If this is a .bin directory, remove it entirely
              if (entry.name === ".bin") {
                await fs.remove(fullPath);
              }
            } else if (entry.isSymbolicLink()) {
              // Remove individual symlinks
              await fs.unlink(fullPath);
            }
          }
        } catch (error) {
          // Ignore errors - directory might not exist or be inaccessible
        }
      };

      const nodeModulesPath = path.join(buildPath, "node_modules");
      if (await fs.pathExists(nodeModulesPath)) {
        await removeBinSymlinks(nodeModulesPath);
      }
    },
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

      // Generate standard PNG icons (for runtime use)
      await createIcon(1);
      await createIcon(2);
      await createIcon(3);
      await createIcon(4);
      await createIcon(8);

      // Generate Windows ICO file (always generate for cross-platform builds)
      await pngToIco(path.join(__dirname, "extra/icon@8x.png")).then((buf) =>
        fs.writeFileSync(path.join(__dirname, "extra/icon.ico"), buf as any),
      );

      // Generate macOS ICNS file (only on macOS due to iconutil requirement)
      if (platform === "darwin") {
        await createIcns();
      }
    },
    postMake: async (config, makeResults) => {
      // Add DMG helper to automatically remove quarantine when app is copied
      if (process.platform === "darwin") {
        for (const result of makeResults) {
          if (result.platform === "darwin") {
            // Find the DMG file - artifacts can be an array of strings or objects
            const dmgPath = result.artifacts.find((artifact: any) => {
              const artifactPath =
                typeof artifact === "string" ? artifact : artifact?.path;
              return artifactPath?.endsWith(".dmg");
            });

            const dmgPathStr =
              typeof dmgPath === "string" ? dmgPath : (dmgPath as any)?.path;

            if (dmgPathStr) {
              try {
                const helperScript = path.join(
                  __dirname,
                  "scripts/dmg-helper.applescript",
                );
                const helperApp = path.join(
                  __dirname,
                  "scripts/Pensieve Installer.app",
                );

                console.log(`Looking for helper script at: ${helperScript}`);
                console.log(`DMG path: ${dmgPathStr}`);

                // Compile AppleScript to .app bundle
                if (await fs.pathExists(helperScript)) {
                  console.log("Compiling AppleScript to app bundle...");
                  await execAsync(
                    `osacompile -o "${helperApp}" "${helperScript}"`,
                  );

                  // Convert DMG to read-write, mount it, add helper, then convert back
                  const tempDmgBase = dmgPathStr.replace(/\.dmg$/, ".rw");
                  const tempDmg = `${tempDmgBase}.dmg`;

                  // Remove temp file if it exists
                  if (await fs.pathExists(tempDmg)) {
                    await fs.remove(tempDmg);
                  }

                  console.log("Converting DMG to read-write format...");
                  await execAsync(
                    `hdiutil convert "${dmgPathStr}" -format UDRW -o "${tempDmgBase}" -quiet`,
                  );

                  // Mount the read-write DMG (hdiutil adds .dmg extension automatically)
                  console.log("Mounting DMG...");
                  const mountOutput = await execAsync(
                    `hdiutil attach "${tempDmg}" -nobrowse -plist`,
                  );

                  // Parse mount point from plist output or stdout
                  let mountPoint: string | undefined;
                  if (mountOutput.stdout.includes("<key>mount-point</key>")) {
                    // Parse plist XML - find mount-point key and get the following string value
                    const plistLines = mountOutput.stdout.split("\n");
                    for (let i = 0; i < plistLines.length; i++) {
                      if (plistLines[i].includes("<key>mount-point</key>")) {
                        // Next non-empty line should be the string value
                        for (let j = i + 1; j < plistLines.length; j++) {
                          const stringMatch = plistLines[j].match(
                            /<string>(.*?)<\/string>/,
                          );
                          if (stringMatch) {
                            const [, mountPointValue] = stringMatch;
                            mountPoint = mountPointValue;
                            break;
                          }
                        }
                        break;
                      }
                    }
                  }

                  // Fallback to regex on stdout/stderr if plist parsing didn't work
                  if (!mountPoint) {
                    const match = (
                      mountOutput.stdout + mountOutput.stderr
                    ).match(/\/Volumes\/[^\s\n<]+/);
                    mountPoint = match?.[0];
                  }

                  if (mountPoint) {
                    console.log(`DMG mounted at: ${mountPoint}`);
                    // Verify helper app exists before copying
                    if (!(await fs.pathExists(helperApp))) {
                      throw new Error(`Helper app not found at: ${helperApp}`);
                    }
                    const targetPath = path.join(
                      mountPoint,
                      "Pensieve Installer.app",
                    );
                    console.log(`Copying ${helperApp} to ${targetPath}`);
                    // Copy helper app to DMG
                    await fs.copy(helperApp, targetPath);
                    // Verify copy succeeded
                    if (!(await fs.pathExists(targetPath))) {
                      throw new Error(
                        `Failed to copy helper app to ${targetPath}`,
                      );
                    }
                    console.log("Copied installer helper to DMG");

                    // Unmount DMG
                    await execAsync(`hdiutil detach "${mountPoint}" -quiet`);
                    console.log("Unmounted DMG");

                    // Convert back to read-only and replace original
                    console.log("Converting DMG back to read-only...");
                    const outputBase = dmgPathStr.replace(/\.dmg$/, "");
                    // Remove original DMG if it exists
                    if (await fs.pathExists(dmgPathStr)) {
                      await fs.remove(dmgPathStr);
                    }
                    await execAsync(
                      `hdiutil convert "${tempDmg}" -format UDZO -o "${outputBase}" -quiet`,
                    );

                    // Clean up temp files
                    await fs.remove(tempDmg);
                    await fs.remove(helperApp);

                    console.log("Successfully added installer helper to DMG");
                  } else {
                    console.warn(
                      "Could not find mount point from hdiutil output",
                    );
                  }
                } else {
                  console.warn(`Helper script not found at: ${helperScript}`);
                }
              } catch (error) {
                console.error("Failed to add DMG helper:", error);
                // Don't fail the build if this fails
              }
            } else if (result.platform === "darwin") {
              // Only warn if this is a darwin result (skip other platforms)
              console.warn(
                "DMG file not found in artifacts:",
                result.artifacts,
              );
            }
          }
        }
      }
      return makeResults;
    },
  },
};

export default config;
