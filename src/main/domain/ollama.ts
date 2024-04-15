import { getSettings } from "./settings";

const request = async <T = any>(target: string, body?: any) => {
  const { llm } = await getSettings();
  const [method, url] = target.split(" ", 2);
  const result = await fetch(
    `${llm.providerConfig.ollama.chatModel.baseUrl}${url}`,
    {
      method,
      body:
        method === "GET"
          ? undefined
          : JSON.stringify({ ...body, format: "json", stream: false }),
    },
  );
  if (!result.ok) {
    throw new Error(`Failed to fetch ${target}: ${result.statusText}`);
  }
  return result.json() as T;
};

const getModels = async () =>
  request<{ models: { name: string; size: number }[] }>("GET /api/tags");

const hasModel = async (name: string) => {
  const models = await getModels();
  return models.models.some((m) => m.name === name);
};

export const pullModel = async (name: string) => {
  if (await hasModel(name)) {
    return;
  }

  await request("POST /api/pull", { name });
};
