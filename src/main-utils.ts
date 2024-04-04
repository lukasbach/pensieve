import path from "path";

export const getExtraResourcesFolder = () => {
  return process.env.NODE_ENV === "development"
    ? path.join(__dirname, "../../extra")
    : path.join(process.resourcesPath, "extra");
};

export const getMillisecondsFromTimeString = (time: string) => {
  if (!time) return 0;
  const [h, m, s, ms] = time.split(/[:.]/).map(Number);
  return (h * 60 * 60 + m * 60 + s) * 1000 + ms;
};

export const buildArgs = (
  argMap: Record<string, boolean | null | number | string>,
) => {
  const args: string[] = [];
  for (const [keyRaw, value] of Object.entries(argMap)) {
    const key = keyRaw.startsWith("-") ? keyRaw : `-${keyRaw}`;
    if (keyRaw.startsWith("_")) {
      args.push(String(value));
    } else if (value === null || value === true) {
      args.push(key);
    } else if (value === false) {
      // NOOP
    } else {
      args.push(key, String(value));
    }
  }
  return args;
};
