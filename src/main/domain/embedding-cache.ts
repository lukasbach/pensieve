import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

export const embeddingCache = {
  cachedVectorStore: null as MemoryVectorStore | null,
  cachedVectorStoreKey: null as string | null,
  semanticStoreVersion: 0,
  invalidate() {
    this.semanticStoreVersion += 1;
    this.cachedVectorStore = null;
    this.cachedVectorStoreKey = null;
  },
};