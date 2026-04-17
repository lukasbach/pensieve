import { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  TagDefinition,
  abbreviateTagName,
  availableTagColors,
  findTagDefinition,
  normalizeSelectedTags,
  normalizeTagName,
} from "../../tagging";
import styles from "./tag-input.module.css";

type TagInputProps = {
  availableTags: TagDefinition[];
  value: string[];
  onChange: (tags: string[]) => void | Promise<void>;
  onCreateTag?: (name: string) => TagDefinition | Promise<TagDefinition>;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
};

const mergeTags = (
  availableTags: TagDefinition[],
  localTags: TagDefinition[],
) => {
  return [...availableTags, ...localTags].reduce((acc, tag) => {
    if (!findTagDefinition(acc, tag.name)) {
      acc.push(tag);
    }

    return acc;
  }, [] as TagDefinition[]);
};

const TagChip: FC<{
  color: TagDefinition["color"];
  name: string;
  onRemove?: () => void;
}> = ({ color, name, onRemove }) => {
  const normalizedName = normalizeTagName(name);

  return (
    <span className={styles.tagChip} data-color={color} title={normalizedName}>
      <span className={styles.tagChipLabel}>
        {abbreviateTagName(normalizedName, 32)}
      </span>
      {onRemove && (
        <button
          type="button"
          className={styles.tagChipRemoveButton}
          aria-label={`Remove ${normalizedName} tag`}
          onClick={onRemove}
        >
          x
        </button>
      )}
    </span>
  );
};

export const TagInput: FC<TagInputProps> = ({
  ariaLabel,
  autoFocus,
  availableTags,
  onChange,
  onCreateTag,
  placeholder = "Add a tag",
  value,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [localTags, setLocalTags] = useState<TagDefinition[]>([]);
  const selectedTags = useMemo(() => normalizeSelectedTags(value), [value]);
  const mergedTags = useMemo(
    () => mergeTags(availableTags, localTags),
    [availableTags, localTags],
  );
  const normalizedQuery = normalizeTagName(inputValue).toLowerCase();
  const selectedTagNames = useMemo(
    () =>
      new Set(selectedTags.map((tag) => normalizeTagName(tag).toLowerCase())),
    [selectedTags],
  );
  const suggestions = useMemo(() => {
    return mergedTags
      .filter((tag) => {
        const normalizedName = normalizeTagName(tag.name).toLowerCase();

        return (
          !selectedTagNames.has(normalizedName) &&
          (!normalizedQuery || normalizedName.includes(normalizedQuery))
        );
      })
      .slice(0, 5);
  }, [mergedTags, normalizedQuery, selectedTagNames]);

  useEffect(() => {
    setLocalTags((current) =>
      current.filter((tag) => !findTagDefinition(availableTags, tag.name)),
    );
  }, [availableTags]);

  const commitTags = async (nextTags: string[]) => {
    await Promise.resolve(onChange(normalizeSelectedTags(nextTags)));
  };

  const removeTag = async (name: string) => {
    const normalizedName = normalizeTagName(name).toLowerCase();

    await commitTags(
      selectedTags.filter(
        (tag) => normalizeTagName(tag).toLowerCase() !== normalizedName,
      ),
    );
  };

  const addTag = async (rawName: string) => {
    const normalizedName = normalizeTagName(rawName);

    if (!normalizedName) {
      return;
    }

    const existingTag = findTagDefinition(mergedTags, normalizedName);
    const resolvedTag =
      existingTag ??
      (onCreateTag && (await Promise.resolve(onCreateTag(normalizedName))));

    if (!resolvedTag) {
      return;
    }

    if (!existingTag) {
      setLocalTags((current) => mergeTags(current, [resolvedTag]));
    }

    await commitTags([...selectedTags, resolvedTag.name]);
    setInputValue("");
    setIsFocused(true);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.root}>
      <div className={styles.control}>
        {selectedTags.map((tag) => {
          const definition = findTagDefinition(mergedTags, tag);

          return (
            <TagChip
              key={tag}
              name={tag}
              color={definition?.color ?? availableTagColors[0]}
              onRemove={() => {
                void removeTag(tag);
              }}
            />
          );
        })}
        <input
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onChange={(event) => setInputValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void addTag(inputValue);
            }

            if (
              event.key === "Backspace" &&
              !inputValue &&
              selectedTags.length
            ) {
              event.preventDefault();
              void removeTag(selectedTags[selectedTags.length - 1]);
            }

            if (event.key === "Escape") {
              setIsFocused(false);
            }
          }}
        />
      </div>

      {isFocused && suggestions.length > 0 && (
        <div
          className={styles.suggestions}
          role="listbox"
          aria-label="Tag suggestions"
        >
          {suggestions.map((tag) => (
            <button
              key={tag.name}
              type="button"
              className={styles.suggestionButton}
              role="option"
              aria-label={`Add ${tag.name} tag`}
              title={tag.name}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                void addTag(tag.name);
              }}
            >
              <TagChip name={tag.name} color={tag.color} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
