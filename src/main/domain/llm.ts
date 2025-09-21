import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import log from "electron-log/main";
import * as settings from "./settings";
import { RecordingTranscript, Settings } from "../../types";
import { isNotNull } from "../../utils";
import { getProgress, setProgress } from "./postprocess";
import { pullModel } from "./ollama";

const promptTemplate = `Be short and concise. 

The following is a meeting transcript. The user is aware that the context is a meeting transcript, and does not need to be reminded of that.
"Me" refers to the user you are talking to, "They" refers to the other person in the conversation.
The information in the square brackets describes the timestamp of when the text was spoken.
Answer the following question based only on the provided text:

<context>
{context}
</context>

Question: {input}`;

const prompts = {
  summary: "Generate a short summary of the meeting. ",
  actionItems:
    "Extract action items from the meeting. Each action item should be a task that the user needs to follow up on after the meeting. " +
    "Provide one action item per line, in the format '{Me/They}: {action item text} ({timestamp})'. ",
  sentenceSummary:
    "Summarize the meeting very briefly in a very short sentence of less than 10 words. ",
};

const parseActionItems = (text: string) => {
  return text
    .split("\n")
    .map((line) => {
      const match = line.match(/^(.*?): (.*) \((\d*)\)$/);
      if (!match) {
        log.warn("Ignoring invalid action item line:", line);
        return null;
      }
      return {
        isMe: match[1].toLowerCase() === "me",
        action: match[2],
        time: parseInt(match[3], 10),
      };
    })
    .filter(isNotNull);
};

export const getChatModel = async () => {
  const { llm } = await settings.getSettings();
  switch (llm.provider) {
    case "ollama":
      await pullModel(llm.providerConfig.ollama.chatModel.model);
      return new ChatOllama(llm.providerConfig.ollama.chatModel);
    case "openai": {
      return new ChatOpenAI(llm.providerConfig.openai.chatModel);
    }
    default:
      throw new Error(`Invalid LLM provider: ${llm.provider}`);
  }
};

export const getEmbeddings = async () => {
  const { llm } = await settings.getSettings();

  switch (llm.provider) {
    case "ollama":
      await pullModel(llm.providerConfig.ollama.embeddings.model);
      return new OllamaEmbeddings(llm.providerConfig.ollama.embeddings);
    case "openai":
      return new OpenAIEmbeddings({
        ...llm.providerConfig.openai.embeddings,
        apiKey: llm.providerConfig.openai.chatModel.apiKey,
      });
    default:
      throw new Error(`Invalid LLM provider: ${llm.provider}`);
  }
};

const prepareContext = async (transcript: RecordingTranscript) => {
  const splitter = new RecursiveCharacterTextSplitter();
  const splitDocs = await splitter.splitDocuments([
    new Document({
      pageContent: transcript.transcription
        .map((t) => {
          const speakerText =
            t.speaker === "0"
              ? "They"
              : t.speaker === "1"
                ? "Me"
                : "Participant";
          return `${speakerText}: ${t.text} [${t.offsets.from}]`;
        })
        .join("\n"),
    }),
  ]);
  return splitDocs;
};

const prepareLangchain = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
  const documentChain = await createStuffDocumentsChain({
    llm: await getChatModel(),
    prompt,
  });
  return documentChain;
};

const updateProgress = async (step: keyof Settings["llm"]["features"]) => {
  const { llm } = await settings.getSettings();
  if (!llm.features[step]) return;
  const total = Object.values(llm.features).filter((f) => f).length;
  setProgress("summary", (getProgress("summary") ?? 0) + 1 / total);
};

const summarizeWithEmbeddings = async (transcript: RecordingTranscript) => {
  const { llm } = await settings.getSettings();
  const context = await prepareContext(transcript);
  const chain = await prepareLangchain();

  const vectorstore = await MemoryVectorStore.fromDocuments(
    context,
    await getEmbeddings(),
  );
  const retriever = vectorstore.asRetriever();
  const retrievalChain = await createRetrievalChain({
    combineDocsChain: chain,
    retriever,
  });

  const summary = llm.features.summary
    ? await retrievalChain.invoke({
        input: prompts.summary + llm.prompt,
      })
    : null;
  updateProgress("summary");
  const actionItems = llm.features.actionItems
    ? await retrievalChain.invoke({
        input: prompts.actionItems + llm.prompt,
      })
    : null;
  updateProgress("actionItems");
  const sentenceSummary = llm.features.sentenceSummary
    ? await retrievalChain.invoke({
        input: prompts.sentenceSummary + llm.prompt,
      })
    : null;
  updateProgress("sentenceSummary");
  return {
    summary: summary?.answer ?? null,
    actionItems: actionItems?.answer
      ? parseActionItems(actionItems.answer)
      : null,
    sentenceSummary: sentenceSummary?.answer ?? null,
  };
};

const summarizeWithContext = async (transcript: RecordingTranscript) => {
  const { llm } = await settings.getSettings();
  const context = await prepareContext(transcript);
  const chain = await prepareLangchain();

  const summary = llm.features.summary
    ? await chain.invoke({
        input: prompts.summary + llm.prompt,
        context,
      })
    : null;
  updateProgress("summary");
  const actionItems = llm.features.actionItems
    ? await chain.invoke({
        input: prompts.actionItems + llm.prompt,
        context,
      })
    : null;
  updateProgress("actionItems");
  const sentenceSummary = llm.features.sentenceSummary
    ? await chain.invoke({
        input: prompts.sentenceSummary + llm.prompt,
        context,
      })
    : null;
  updateProgress("sentenceSummary");
  return {
    summary,
    actionItems: actionItems ? parseActionItems(actionItems) : null,
    sentenceSummary,
  };
};

export const summarize = async (transcript: RecordingTranscript) => {
  const { llm } = await settings.getSettings();
  return llm.useEmbedding
    ? summarizeWithEmbeddings(transcript)
    : summarizeWithContext(transcript);
};
