import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import * as settings from "./settings";
import { pullModel } from "./ollama";

type LlmProvider = "ollama" | "openai";

export const getConfiguredChatModel = async ({
  model,
  provider,
}: {
  model: string;
  provider: LlmProvider;
}) => {
  const { providers } = await settings.getSettings();

  switch (provider) {
    case "ollama":
      await pullModel(model, providers.ollama.baseUrl);
      return new ChatOllama({
        baseUrl: providers.ollama.baseUrl,
        model,
      });
    case "openai":
      return new ChatOpenAI({
        apiKey: providers.openai.apiKey,
        model,
        ...(providers.openai.useCustomUrl && providers.openai.baseURL
          ? { configuration: { baseURL: providers.openai.baseURL } }
          : {}),
      });
    default:
      throw new Error(`Invalid LLM provider: ${provider}`);
  }
};
