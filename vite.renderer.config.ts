import type { ConfigEnv, Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pluginExposeRenderer } from "./vite.base.config";

const getContentSecurityPolicy = (isDevelopment: boolean) =>
  [
    "default-src 'self'",
    `script-src 'self'${isDevelopment ? " 'unsafe-inline'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: screenshot:",
    "font-src 'self' data:",
    "media-src 'self' http://localhost:* http://127.0.0.1:* recording:",
    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

const contentSecurityPolicyPlugin = (
  contentSecurityPolicy: string,
  injectMetaTag: boolean,
): Plugin => ({
  name: "pensieve-content-security-policy",
  transformIndexHtml: () =>
    injectMetaTag
      ? [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content: contentSecurityPolicy,
            },
            injectTo: "head-prepend",
          },
        ]
      : [],
});

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"renderer">;
  const { root, mode, command, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? "";
  const isDevelopment = command === "serve";
  const contentSecurityPolicy = getContentSecurityPolicy(command === "serve");

  return {
    root,
    mode,
    base: "./",
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [
      contentSecurityPolicyPlugin(contentSecurityPolicy, !isDevelopment),
      pluginExposeRenderer(name),
      react(),
    ],
    resolve: {
      preserveSymlinks: true,
    },
    server: {
      headers: {
        "Content-Security-Policy": contentSecurityPolicy,
      },
    },
    clearScreen: false,
  } as UserConfig;
});
