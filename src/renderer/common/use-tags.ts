import { useCallback, useMemo } from "react";
import {
  addStoredTag,
  createTagDefinition,
  findTagDefinition,
  getTagDefinitions,
  retainStoredTags,
} from "../../tagging";
import type { Settings } from "../../types";
import { historyApi, mainApi } from "../api";

type UseTagsOptions = {
  currentTags?: string[];
  onChange?: (tags: string[]) => void | Promise<void>;
  saveSettings?: (
    partialSettings: Parameters<typeof mainApi.saveSettings>[0],
  ) => Promise<void>;
  settings?: Settings;
  syncStoredTags?: boolean;
};

const haveRemovedTags = (currentTags: string[], nextTags: string[]) => {
  return currentTags.some((tag) => !nextTags.includes(tag));
};

export const useTags = ({
  currentTags = [],
  onChange,
  saveSettings,
  settings,
  syncStoredTags = false,
}: UseTagsOptions = {}) => {
  const availableTags = useMemo(
    () => getTagDefinitions(settings?.tags ?? {}),
    [settings?.tags],
  );

  const createTag = useCallback(
    async (name: string) => {
      const existingTag = findTagDefinition(availableTags, name);

      if (existingTag) {
        return existingTag;
      }

      const createdTag = createTagDefinition(name);

      if (saveSettings) {
        await saveSettings({
          tags: addStoredTag(settings?.tags, createdTag),
        });
      }

      return createdTag;
    },
    [availableTags, saveSettings, settings?.tags],
  );

  const setTags = useCallback(
    async (nextTags: string[]) => {
      await Promise.resolve(onChange?.(nextTags));

      if (
        !syncStoredTags ||
        !saveSettings ||
        !haveRemovedTags(currentTags, nextTags)
      ) {
        return;
      }

      const recordings = await historyApi.getRecordings();
      const referencedTags = Object.values(recordings).flatMap(
        (recording) => recording.tags ?? [],
      );
      const nextStoredTags = retainStoredTags(settings?.tags, [
        ...referencedTags,
        ...nextTags,
      ]);

      if (
        JSON.stringify(nextStoredTags) !== JSON.stringify(settings?.tags ?? {})
      ) {
        await saveSettings({ tags: nextStoredTags });
      }
    },
    [currentTags, onChange, saveSettings, settings?.tags, syncStoredTags],
  );

  return {
    availableTags,
    createTag,
    setTags,
  };
};
