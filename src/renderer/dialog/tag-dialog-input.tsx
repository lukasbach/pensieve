import { FC } from "react";
import { TagInput } from "../common/tag-input";
import { useSettings } from "../common/use-settings";
import { useTags } from "../common/use-tags";

type TagDialogInputProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  autoFocus?: boolean;
};

export const TagDialogInput: FC<TagDialogInputProps> = ({
  autoFocus,
  label,
  onChange,
  value,
}) => {
  const { settings, saveSettings } = useSettings();
  const { availableTags, createTag, setTags } = useTags({
    onChange,
    saveSettings,
    settings,
  });

  return (
    <TagInput
      autoFocus={autoFocus}
      ariaLabel={label}
      availableTags={availableTags}
      value={value}
      onChange={setTags}
      onCreateTag={createTag}
    />
  );
};
