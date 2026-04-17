const supportedTagColors = [
  "amber",
  "blue",
  "bronze",
  "brown",
  "crimson",
  "cyan",
  "gold",
  "grass",
  "gray",
  "green",
  "indigo",
  "iris",
  "jade",
  "lime",
  "mint",
  "orange",
  "pink",
  "plum",
  "purple",
  "red",
  "ruby",
  "sky",
  "teal",
  "tomato",
  "violet",
  "yellow",
] as const;

export type TagColor = (typeof supportedTagColors)[number];

export type TagDefinition = {
  name: string;
  color: TagColor;
};

const tagNameCollator = new Intl.Collator(undefined, {
  sensitivity: "base",
});

export const availableTagColors: readonly TagColor[] = [
  "teal",
  "blue",
  "violet",
  "pink",
  "amber",
  "red",
  "green",
  "cyan",
  "indigo",
  "orange",
];

const supportedTagColorSet = new Set<string>(supportedTagColors);

export const normalizeTagName = (value: string) => {
  return value.trim().replace(/\s+/g, " ");
};

export const getTagKey = (value: string) => {
  return normalizeTagName(value).toLowerCase();
};

export const normalizeSelectedTags = (tags?: string[]): string[] => {
  const seen = new Set<string>();

  return (tags ?? []).flatMap((tag) => {
    const normalized = normalizeTagName(tag);
    const key = getTagKey(normalized);

    if (!normalized || seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [normalized];
  });
};

const isTagColor = (value: string): value is TagColor => {
  return supportedTagColorSet.has(value);
};

export const pickRandomTagColor = (): TagColor => {
  return availableTagColors[
    Math.floor(Math.random() * availableTagColors.length)
  ];
};

const normalizeStoredTagColor = (value: unknown): TagColor => {
  if (typeof value !== "string" || !value.trim().length) {
    return pickRandomTagColor();
  }

  const normalizedValue = value.trim().toLowerCase();

  if (isTagColor(normalizedValue)) {
    return normalizedValue;
  }

  return pickRandomTagColor();
};

export const createTagDefinition = (name: string): TagDefinition => {
  return {
    name: normalizeTagName(name),
    color: pickRandomTagColor(),
  };
};

function hasStoredTag(storedTags: Record<string, string>, name: string) {
  const normalizedName = getTagKey(name);

  return Object.keys(storedTags).some(
    (existingName) => getTagKey(existingName) === normalizedName,
  );
}

export const normalizeStoredTags = (
  rawTags: unknown,
): Record<string, TagColor> => {
  if (!rawTags) {
    return {} as Record<string, TagColor>;
  }

  if (Array.isArray(rawTags)) {
    return rawTags.reduce(
      (acc, item) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("name" in item) ||
          !("color" in item)
        ) {
          return acc;
        }

        const normalizedName = normalizeTagName(String(item.name));
        const normalizedColor = normalizeStoredTagColor(item.color);

        if (!normalizedName || hasStoredTag(acc, normalizedName)) {
          return acc;
        }

        acc[normalizedName] = normalizedColor;
        return acc;
      },
      {} as Record<string, TagColor>,
    );
  }

  if (typeof rawTags !== "object") {
    return {} as Record<string, TagColor>;
  }

  return Object.entries(rawTags as Record<string, unknown>).reduce(
    (acc, [name, color]) => {
      const normalizedName = normalizeTagName(name);

      if (!normalizedName || hasStoredTag(acc, normalizedName)) {
        return acc;
      }

      acc[normalizedName] = normalizeStoredTagColor(color);
      return acc;
    },
    {} as Record<string, TagColor>,
  );
};

export const getTagDefinitions = (
  storedTags: Record<string, TagColor> = {},
) => {
  return Object.entries(normalizeStoredTags(storedTags))
    .map(([name, color]) => ({ name, color }))
    .sort((left, right) => tagNameCollator.compare(left.name, right.name));
};

export const findTagDefinition = (tags: TagDefinition[], name: string) => {
  const normalizedName = getTagKey(name);

  return tags.find((tag) => getTagKey(tag.name) === normalizedName);
};

export const getTagColor = (tags: TagDefinition[], name: string) => {
  return findTagDefinition(tags, name)?.color ?? availableTagColors[0];
};

export const addStoredTag = (
  storedTags: Record<string, TagColor> | undefined,
  tag: TagDefinition,
) => {
  const normalizedStoredTags = normalizeStoredTags(storedTags);

  if (hasStoredTag(normalizedStoredTags, tag.name)) {
    return normalizedStoredTags;
  }

  return {
    ...normalizedStoredTags,
    [normalizeTagName(tag.name)]: tag.color,
  };
};

export const retainStoredTags = (
  storedTags: Record<string, TagColor> | undefined,
  allowedTags: string[],
) => {
  const normalizedStoredTags = normalizeStoredTags(storedTags);
  const allowedTagKeys = new Set(
    normalizeSelectedTags(allowedTags).map(getTagKey),
  );

  return Object.entries(normalizedStoredTags).reduce(
    (acc, [name, color]) => {
      if (allowedTagKeys.has(getTagKey(name))) {
        acc[name] = color;
      }

      return acc;
    },
    {} as Record<string, TagColor>,
  );
};

export const abbreviateTagName = (name: string, maxLength: number): string => {
  const normalized = normalizeTagName(name);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength);
};
