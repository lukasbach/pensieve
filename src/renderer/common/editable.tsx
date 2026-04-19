import { FC, ReactNode, useState } from "react";
import { Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { HiCheck, HiMiniPencilSquare } from "react-icons/hi2";

export const Editable: FC<{
  renderValue?: (props: { value: any; editBtn: ReactNode }) => ReactNode;
  renderInput?: (props: {
    submitBtn: ReactNode;
    value: any;
    onChange: (value: any) => void;
  }) => ReactNode;
  value: any;
  onChange: (value: any) => void;
  compact?: boolean;
}> = ({ value, renderValue, renderInput, onChange, compact }) => {
  const [editingValue, setEditingValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const controlSize: "1" | "2" = compact ? "1" : "2";

  const input =
    renderInput ??
    (({ submitBtn, onChange, value }) => (
      <TextField.Root
        size={controlSize}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <TextField.Slot />
        <TextField.Slot>{submitBtn}</TextField.Slot>
      </TextField.Root>
    ));

  const text =
    renderValue ??
    (({ value, editBtn }) => (
      <Flex align="center">
        <Text mr=".5rem">{value}</Text>
        {editBtn}
      </Flex>
    ));

  if (isEditing) {
    return (
      <form
        onSubmit={() => {
          setIsEditing(false);
          onChange(editingValue);
        }}
      >
        {input({
          value: editingValue,
          onChange: setEditingValue,
          submitBtn: (
            <IconButton type="submit" size={controlSize} variant="ghost">
              <HiCheck />
            </IconButton>
          ),
        })}
      </form>
    );
  }
  return text({
    value,
    editBtn: (
      <IconButton
        size={controlSize}
        variant="ghost"
        className="hoverhide-item"
        onClick={() => {
          setIsEditing(true);
          setEditingValue(value);
        }}
      >
        <HiMiniPencilSquare />
      </IconButton>
    ),
  });
};
