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
