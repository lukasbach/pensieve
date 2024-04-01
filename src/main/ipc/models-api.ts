import { models } from "../domain";
import { modelData } from "../../model-data";

export const modelsApi = {
  downloadModel: async (modelId: string) => {
    await models.downloadModel(
      modelData[modelId].url,
      `${modelData[modelId].name}.bin`,
    );
  },
};
