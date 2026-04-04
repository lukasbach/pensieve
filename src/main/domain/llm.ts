import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import log from "electron-log/main";
import * as settings from "./settings";
import { RecordingTranscript, Settings } from "../../types";
import { isNotNull } from "../../utils";
import { getConfiguredChatModel } from "./chat-model";

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

  return getConfiguredChatModel({
    model: llm.models[llm.provider],
    provider: llm.provider,
  });
};

const prepareContext = async (transcript: RecordingTranscript) => {
  return [
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
  ];
};

const prepareLangchain = async () => {
  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
  const documentChain = await createStuffDocumentsChain({
    llm: await getChatModel(),
    prompt,
  });
  return documentChain;
};

const summarizeTranscript = async (
  transcript: RecordingTranscript,
  onProgress?: (progress: number) => void,
) => {
  const { llm } = await settings.getSettings();
  const context = await prepareContext(transcript);
  const chain = await prepareLangchain();
  const total = Object.values(llm.features).filter((feature) => feature).length;
  let completed = 0;

  const updateProgress = (step: keyof Settings["llm"]["features"]) => {
    if (!llm.features[step] || total === 0) {
      return;
    }

    completed += 1;
    onProgress?.(completed / total);
  };

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

export const summarize = summarizeTranscript;
