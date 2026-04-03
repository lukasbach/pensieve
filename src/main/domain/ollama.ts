const request = async <T = any>(
  target: string,
  baseUrl: string,
  body?: any,
) => {
  const [method, url] = target.split(" ", 2);
  const result = await fetch(`${baseUrl}${url}`, {
    method,
    body:
      method === "GET"
        ? undefined
        : JSON.stringify({ ...body, format: "json", stream: false }),
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch ${target}: ${result.statusText}`);
  }
  return result.json() as T;
};

const getModels = async (baseUrl: string) =>
  request<{ models: { name: string; size: number }[] }>(
    "GET /api/tags",
    baseUrl,
  );

const hasModel = async (name: string, baseUrl: string) => {
  const models = await getModels(baseUrl);
  return models.models.some((m) => m.name === name);
};

export const pullModel = async (name: string, baseUrl: string) => {
  if (await hasModel(name, baseUrl)) {
    return;
  }

  await request("POST /api/pull", baseUrl, { name });
};
