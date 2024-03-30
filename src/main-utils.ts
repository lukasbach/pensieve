import path from "path";

export const getExtraResourcesFolder = () => {
  return process.env.NODE_ENV === "development"
    ? path.join(__dirname, "../../extra")
    : process.resourcesPath;
};
